/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import IconButton from '@material-ui/core/IconButton';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import AddMemberIcon from '../../Assets/Icons/AddMember';
import BroomIcon from '../../Assets/Icons/Broom';
import DeleteIcon from '../../Assets/Icons/Delete';
import MoreVertIcon from '../../Assets/Icons/More';
import RemoveMemberIcon from '../../Assets/Icons/RemoveMember';
import UnpinIcon from '../../Assets/Icons/PinOff';
import UserIcon from '../../Assets/Icons/User';
import GroupIcon from '../../Assets/Icons/Group';
import { requestUnpinMessage } from '../../Actions/Client';
import { clearHistory, leaveChat } from '../../Actions/Chat';
import { canClearHistory, canDeleteChat, getViewInfoTitle, isPrivateChat, getDeleteChatTitle, hasOnePinnedMessage, canSwitchBlocked, getChatSender } from '../../Utils/Chat';
import { requestBlockSender, unblockSender } from '../../Actions/Message';
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';
import MessageStore from '../../Stores/MessageStore';
import TdLibController from '../../Controllers/TdLibController';
import './MainMenuButton.css';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { modalManager } from '../../Utils/Modal'; 
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider'; 
import TextField from '@material-ui/core/TextField'; 
 
import { isAdmin } from '../../Utils/Chat';   
import { bool } from 'prop-types';
import User from '../../Assets/Icons/User';
import { hidden } from 'caniuse-lite/data/features';
class MainMenuButton extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          openDialogs: false, 
        };
    }
    state = {
        anchorEl: null
    };

    handleButtonClick = async event => { 
       
        const { currentTarget: anchorEl } = event;

        const chatId = AppStore.getChatId(); 

        const chat = await TdLibController.send({ '@type': 'getChat', chat_id: chatId });
        ChatStore.set(chat); 
        this.setState({ anchorEl });
    };

    handleMenuClose = () => {
        this.setState({ anchorEl: null });
    };

    handleChatInfo = () => {
        this.handleMenuClose();
        setTimeout(() => this.props.openChatDetails(), 150);
    }; 

    handleManageGroupClose = () =>{
        this.setState({openDialogs:false})
    }

    handleClearHistory = () => {
        this.handleMenuClose();

        clearHistory(AppStore.getChatId());
    };

    handleDeleteChat = () => {
        this.handleMenuClose();

        leaveChat(AppStore.getChatId());
    };

    handleUnpin = () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();

        const media = MessageStore.getMedia(chatId);
        if (!media) return false;

        const { pinned } = media;
        if (!pinned) return false;
        if (pinned.length !== 1) return false;

        requestUnpinMessage(chatId, pinned[0].id);
    };

    handleSwitchBlocked = () => {
        this.handleMenuClose();

        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const sender = getChatSender(chatId);
        const { is_blocked } = chat;
        if (is_blocked) {
            unblockSender(sender);
        } else {
            requestBlockSender(sender);
        }

    };  
    render() {
        
        
        const { t } = this.props;
        const { 
            anchorEl, 
        } = this.state; 
        const chatId = AppStore.getChatId();
        const chat = ChatStore.get(chatId);
        if (!chat) return null;

        const { is_blocked } = chat; 
        const clearHistory = canClearHistory(chatId);
        const deleteChat = canDeleteChat(chatId);
        const deleteChatTitle = getDeleteChatTitle(chatId, t);
        const unpinMessage = hasOnePinnedMessage(chatId);
        const switchBlocked = canSwitchBlocked(chatId); 
        
        return (
            <> 
            <Dialog
                open={this.state.openDialogs}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                PaperProps={{
                style: {
                    backgroundColor: "#fff",
                },
                }}
                >

                <DialogTitle id="alert-dialog-title">
                    "Use Google's location service?"
                </DialogTitle>

                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Hello 
                    </DialogContentText>
                </DialogContent>

                <DialogActions>
                    <Button onClick={this.handleManageGroupClose} color="primary">
                            OK
                    </Button>
                </DialogActions>
            </Dialog>
                <IconButton
                    aria-owns={anchorEl ? 'simple-menu' : null}
                    aria-haspopup='true'
                    className='main-menu-button'
                    aria-label='Menu'
                    onClick={this.handleButtonClick}>
                    <MoreVertIcon />
                </IconButton>
                <Menu
                    id='main-menu'
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={this.handleMenuClose}
                    getContentAnchorEl={null}
                    disableAutoFocusItem
                    disableRestoreFocus={true}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right'
                    }}
                    transformOrigin={{
                        vertical: 'top',
                        horizontal: 'right'
                    }}>
                    <MenuItem onClick={this.handleChatInfo}>
                        <ListItemIcon>
                            {isPrivateChat(chatId) ? <UserIcon /> : <GroupIcon />}
                        </ListItemIcon>
                        <ListItemText primary={getViewInfoTitle(chatId, t)} />
                    </MenuItem> 

                    {clearHistory && (
                        <MenuItem onClick={this.handleClearHistory}>
                            <ListItemIcon>
                                <BroomIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('ClearHistory')} />
                        </MenuItem>
                    )}
                    {deleteChat && deleteChatTitle && (
                        <MenuItem onClick={this.handleDeleteChat}>
                            <ListItemIcon>
                                <DeleteIcon />
                            </ListItemIcon>
                            <ListItemText primary={deleteChatTitle} />
                        </MenuItem>
                    )}
                    {unpinMessage && (
                        <MenuItem onClick={this.handleUnpin}>
                            <ListItemIcon>
                                <UnpinIcon />
                            </ListItemIcon>
                            <ListItemText primary={t('UnpinMessageAlertTitle')} />
                        </MenuItem>
                    )}
                    {switchBlocked && (
                        <MenuItem onClick={this.handleSwitchBlocked}>
                            <ListItemIcon>
                                {is_blocked ? <AddMemberIcon /> : <RemoveMemberIcon />}
                            </ListItemIcon>
                            <ListItemText primary={is_blocked ? t('Unblock') : t('BlockContact')} />
                        </MenuItem>
                    )}
                </Menu>
            </>
        );
    }
}

export default withTranslation()(MainMenuButton);
