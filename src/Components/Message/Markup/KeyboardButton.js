/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import PropTypes from 'prop-types';
import { withMessage } from '../MessageContext';
import ListItem from '@material-ui/core/ListItem';
import IconButton from '@material-ui/core/IconButton';
import ArrowTopRightIcon from '../../../Assets/Icons/ArrowTopRight';
import CloseIcon from '../../../Assets/Icons/Close';
import PendingIcon from '../../../Assets/Icons/Pending';
import ShareFilledIcon from '../../../Assets/Icons/ShareFilled';
import { getUserFullName } from '../../../Utils/User';
import { getChatTitle } from '../../../Utils/Chat';
import { setText, showAlert, showInputPasswordAlert, showOpenGameAlert, showOpenUrlAlert, showRequestUrlAlert, showSnackbar } from '../../../Actions/Client';
import { openChatSelect } from '../../../Actions/Message';
import LStore from '../../../Stores/LocalizationStore';
import MessageStore from '../../../Stores/MessageStore';
import UserStore from '../../../Stores/UserStore';
import TdLibController from '../../../Controllers/TdLibController';
import './KeyboardButton.css';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { modalManager } from '../../../Utils/Modal';
import { openChat } from '../../../Actions/Client';
import AppStore from '../../../Stores/ApplicationStore';
import { getSupergroupId } from '../../../Utils/Chat';
class KeyboardButton extends React.Component {
    state = {
        loading: false,
        joinDialog: false,
        groupCode: null,
        joinChatId: null,
        meInGroup: false
    }

    handleCallbackQueryAnswer = (type, result, message) => {
        const { chatId } = this.props;
        const { sender, content, via_bot_user_id } = message;
        const { text, show_alert, url } = result;
        const { game } = content;

        let title = '';
        if (message) {
            if (via_bot_user_id) {
                title = getUserFullName(via_bot_user_id, null);
            } else {
                title = getChatTitle(chatId, false);
            }
        }
        title = title || LStore.getString('Bot');

        if (text) {
            if (show_alert) {
                showAlert({
                    title,
                    message: text,
                    ok: LStore.getString('OK')
                });
            } else {
                showSnackbar(text, closeSnackbar => snackKey => {
                    return (
                        <IconButton
                            key='close'
                            aria-label='Close'
                            color='inherit'
                            className='notification-close-button'
                            onClick={() => { closeSnackbar(snackKey); }}>
                            <CloseIcon />
                        </IconButton>
                    )
                });
            }
        } else if (url) {
            if (type['@type'] === 'inlineKeyboardButtonTypeCallbackGame') {
                const userId = via_bot_user_id ? via_bot_user_id : sender.user_id;
                const user = UserStore.get(userId);

                showOpenGameAlert(game, { message, url, userId, isVerified: user && user.is_verified });
            } else {
                showOpenUrlAlert(url, { punycode: false, ask: false, tryTelegraph: true });
            }
        }
    };

    handleClick = async event => {
        event.preventDefault();
        event.stopPropagation();

        const { chatId, messageId, type } = this.props;
        switch (type['@type']) {
            case 'inlineKeyboardButtonTypeBuy': {
                showAlert({
                    title: LStore.getString('AppName'),
                    message: LStore.getString('PaymentsNotSupported'),
                    ok: LStore.getString('OK')
                });
                break;
            }
            case 'inlineKeyboardButtonTypeCallback':
            case 'inlineKeyboardButtonTypeCallbackGame': {
                /// gamee, querty_bot

                const { data } = type;

                const message = MessageStore.get(chatId, messageId);
                if (!message) break;

                const { sender, content, via_bot_user_id } = message;
                if (!content) break;

                let payload = null;
                let game = null;
                if (type['@type'] === 'inlineKeyboardButtonTypeCallbackGame') {
                    game = content.game;
                    if (!game) break;

                    payload = { '@type': 'callbackQueryPayloadGame', game_short_name: game.short_name };
                } else {
                    payload = { '@type': 'callbackQueryPayloadData', data };
                }

                this.setState({ loading: true });
                const result = await TdLibController.send({
                    '@type': 'getCallbackQueryAnswer',
                    chat_id: chatId,
                    message_id: messageId,
                    payload
                }).finally(() => {
                    this.setState({ loading: false });
                });

                this.handleCallbackQueryAnswer(type, result, message);
                break;
            }
            case 'inlineKeyboardButtonTypeCallbackWithPassword': {
                /// BotFather + transfer bot
                const { data } = type;

                const message = MessageStore.get(chatId, messageId);
                if (!message) break;

                this.setState({ loading: true });
                const passwordState = await TdLibController.send({
                    '@type': 'getPasswordState'
                }).finally(() => {
                    this.setState({ loading: false });
                });

                const { has_password } = passwordState;
                if (!has_password) break;

                showInputPasswordAlert(passwordState, async (password, onCloseDialog, onError) => {
                    console.log('[pwd] onPassword', password);
                    this.setState({ loading: true });
                    let error = null;
                    const result = await TdLibController.send({
                        '@type': 'getCallbackQueryAnswer',
                        chat_id: chatId,
                        message_id: messageId,
                        payload: { '@type': 'callbackQueryPayloadDataWithPassword', data, password }
                    }).catch(e => {
                        error = e;
                    }).finally(() => {
                        this.setState({ loading: false });
                    });

                    if (error) {
                        console.log('[pwd] onPassword error', error);
                        onError && onError(error);
                    } else if (result) {
                        console.log('[pwd] onPassword result', result);
                        onCloseDialog && onCloseDialog();
                        this.handleCallbackQueryAnswer(type, result, message);
                    }
                });
                break;
            }
            case 'inlineKeyboardButtonTypeLoginUrl': {
                const { url, id, forward_text } = type;

                this.setState({ loading: true });
                let hasError = false;
                const result = await TdLibController.send({
                    '@type': 'getLoginUrlInfo',
                    chat_id: chatId,
                    message_id: messageId,
                    button_id: id
                }).catch(e => {
                    hasError = true;
                }).finally(() => {
                    this.setState({ loading: false });
                });

                if (hasError) {
                    showOpenUrlAlert(url, { punycode: false, ask: true, tryTelegraph: true });
                } else {
                    switch (result['@type']) {
                        case 'loginUrlInfoOpen': {
                            const { url, skip_confirm } = result;

                            showOpenUrlAlert(url, { punycode: false, ask: !skip_confirm, tryTelegraph: true });
                            break;
                        }
                        case 'loginUrlInfoRequestConfirmation': {
                            const { url } = result;


                            console.log('[login] result', result);
                            showRequestUrlAlert(url, { result, chatId, messageId, buttonId: id });
                            break;
                        }
                    }
                }

                break;
            }
            case 'inlineKeyboardButtonTypeSwitchInline': {
                /// youtube
                const { in_current_chat, query } = type;

                const message = MessageStore.get(chatId, messageId);
                if (!message) break;

                const { sender, via_bot_user_id } = message;
                let userId = sender.user_id;
                if (via_bot_user_id !== 0) {
                    userId = via_bot_user_id;
                }

                const user = UserStore.get(userId);
                if (!user) break;

                const inline = `@${user.username} ${query}`;

                if (in_current_chat) {
                    setText(inline);
                } else {
                    openChatSelect({ switchInline: inline });
                }

                break;
            }
            case 'inlineKeyboardButtonTypeUrl': {
                /// qwerty_bot
                // const { url } = type;  
                this.onPrepareJoin(type.url); 
                break;
            }
        }
    };

    getIcon(type) {
        switch (type['@type']) {
            case 'inlineKeyboardButtonTypeBuy': {
                return null;
            }
            case 'inlineKeyboardButtonTypeCallback':
            case 'inlineKeyboardButtonTypeCallbackGame': {
                return null;
            }
            case 'inlineKeyboardButtonTypeCallbackWithPassword': {
                return null;
            }
            case 'inlineKeyboardButtonTypeLoginUrl': {
                return <ArrowTopRightIcon className='keyboard-button-icon' />
            }
            case 'inlineKeyboardButtonTypeSwitchInline': {
                const { in_current_chat } = type;

                return !in_current_chat && <ShareFilledIcon className='keyboard-button-icon' />;
            }
            case 'inlineKeyboardButtonTypeUrl': {
                return <ArrowTopRightIcon className='keyboard-button-icon' />
            }
        }
    }
    //准备加入群聊
    onPrepareJoin = (url) =>{
        const url00 = url;
        let result = null;
        let groupCode = null;
        let splitUrl = url00.split('=');
        let isGroup = false;
        if (splitUrl[1]) {
            groupCode = "t.me/joinchat/" + splitUrl[1];
            result = TdLibController.send({
                '@type': 'checkChatInviteLink',
                invite_link: groupCode,
            }).then(result => {
                isGroup = true; 
                this.setState({ groupCode: groupCode});  
                this.checkMeInGroup(result.chat_id,isGroup,url00);
            }).finally(data => {
                
            }).catch(e => {
                isGroup = false;
            });
        }

    }
    //判断本账号是否在该群聊中
    checkMeInGroup = (joinChatId,isGroup,url00) => { 
        let uid = UserStore.getMyId(); 
        const supergroupId = getSupergroupId(joinChatId);
        this.setState({joinChatId:joinChatId}); 
        //获取到的链接里的id为0的话 即自己不在该群聊
        if(joinChatId === 0) {
            //不在群聊则判断该链接是否是群组，是的话则弹出是否加入群聊对话框，不是的话则弹出打开网页链接对话框
            if (isGroup) {
                this.onOpenDialog();
            } else {
                showOpenUrlAlert(url00, { punycode: false, ask: true, tryTelegraph: true });
            } 
        }else{
            TdLibController.send({
                '@type': 'getSupergroupMembers',
                "supergroup_id": supergroupId,
                "offset": 0,
                "limit": 20000,
            }).then(data => {
                let isFind = false;
                for (var i = 0; i < data.members.length; i++) {
                    let member = data.members[i];
                    if (member.user_id === uid) {
                        isFind = true; 
                    }
                }
                if (isFind == true) {
                    //在群聊中则打开进入群聊对话框
                    this.onOpenMeInGroupDialog();
                } 
                    
            }).catch(err => { 
            });
        }
        
    }


    onOpenDialog = () => {
        this.setState({ joinDialog: true });
    }
    onCloseDialog = () => {
        this.setState({ joinDialog: false });
    }

    onOpenMeInGroupDialog = () => {
        this.setState({ meInGroup: true });
    }
    onCloseMeInGroupDialog = () => {
        this.setState({ meInGroup: false });
    }
    //打开群聊
    onOpenChat = (chatId) =>{
        // openChat(chatId); 
        openChat(chatId, null, false);
    } 
    
    //确定打开群聊,,这个事件需要用 onMouseDown。否则聊天框的顶部会弹出 转发信息的对话框
    onConfirmOpen = event =>{ 
        const {joinChatId} = this.state; 
        this.onCloseMeInGroupDialog();
        this.onOpenChat(joinChatId);
    }
    //确定加入群聊
    onConfirmJoin = () => {
        const { groupCode } = this.state;
        if (groupCode) {
            TdLibController.send({
                '@type': 'joinChatByInviteLink',
                invite_link: groupCode,
            }).then(result => {
                const chatId = result.id;
                //加入群聊后打开群聊
                this.onOpenChat(chatId);
            }).finally(data => {
                this.onCloseDialog();
            }).catch(e => {

            });
        }
    }

   
    render() {
        const { text, type } = this.props;
        const { loading, joinDialog } = this.state;
        const icon = this.getIcon(type);
        return (
            <>
                <Dialog
                    manager={modalManager}
                    transitionDuration={0}
                    open={joinDialog}
                    onClose={this.onCloseDialog}
                    aria-labelledby='fatal-error-dialog-title'
                    aria-describedby='fatal-error-dialog-description'>
                    <DialogTitle id='fatal-error-dialog-title'>提示</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            您确定要加入该群组吗？
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.onConfirmJoin} color='primary' autoFocus>
                            确定
                        </Button>
                        <Button onClick={this.onCloseDialog} color='primary' autoFocus>
                            关闭
                        </Button>
                    </DialogActions>
                </Dialog>
                <Dialog
                    manager={modalManager}
                    transitionDuration={0}
                    open={this.state.meInGroup}
                    onClose={this.onCloseMeInGroupDialog}
                    aria-labelledby='fatal-error-dialog-title'
                    aria-describedby='fatal-error-dialog-description'>
                    <DialogTitle id='fatal-error-dialog-title'>提示</DialogTitle>
                    <DialogContent>
                        <DialogContentText>
                            您已经在该群聊中，要打开该群聊吗？
                        </DialogContentText>
                    </DialogContent>
                    <DialogActions>
                        <Button onMouseDown={this.onConfirmOpen} color='primary' autoFocus>
                            确定
                        </Button>
                        <Button onClick={this.onCloseMeInGroupDialog} color='primary' autoFocus>
                            关闭
                        </Button>
                    </DialogActions>
                </Dialog>
                
                <ListItem className='keyboard-button' button onClick={this.handleClick}>
                    {text}
                    {icon}
                    {loading && (
                        <PendingIcon
                            className='keyboard-button-progress'
                            viewBox='0 0 14 14'
                        />
                    )}
                </ListItem>
            </>
        );
    }

}

KeyboardButton.propTypes = {
    chatId: PropTypes.number,
    messageId: PropTypes.number,
    text: PropTypes.string,
    type: PropTypes.object,
    onClick: PropTypes.func
};

export default withMessage(KeyboardButton);