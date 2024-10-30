/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { compose } from '../Utils/HOC';
import withLanguage from '../Language';
import withSnackbarNotifications from '../Notifications';
import PipPlayer from './Player/PipPlayer';
import ForwardDialog from './Popup/ForwardDialog';
import ChatInfo from './ColumnRight/ChatInfo';
import Dialogs from './ColumnLeft/Dialogs';
import DialogDetails from './ColumnMiddle/DialogDetails';
import InstantViewer from './InstantView/InstantViewer';
import MediaViewer from './Viewer/MediaViewer';
import ProfileMediaViewer from './Viewer/ProfileMediaViewer';
import { highlightMessage } from '../Actions/Client';
import AppStore from '../Stores/ApplicationStore';
import ChatStore from '../Stores/ChatStore';
import InstantViewStore from '../Stores/InstantViewStore';
import UserStore from '../Stores/UserStore';
import PlayerStore from '../Stores/PlayerStore';
import TdLibController from '../Controllers/TdLibController';
import '../TelegramApp.css';
import Actions from './Actions'; 
import { isAdmin } from '../Utils/Chat';  
class MainPage extends React.Component {
    constructor(props) {
        super(props);

        this.dialogDetailsRef = React.createRef();

        const { isChatDetailsVisible, mediaViewerContent, profileMediaViewerContent, isSmallWidth } = AppStore;

        this.state = {
            isChatDetailsVisible,
            mediaViewerContent,
            profileMediaViewerContent,
            isSmallWidth,
            forwardInfo: null,
            instantViewContent: null,
            videoInfo: null,
            permissions:null,
        };
    }

    componentDidMount() {
        TdLibController.on('update', this.onUpdateNewPermission); 
        UserStore.on('clientUpdateOpenUser', this.onClientUpdateOpenUser);
        ChatStore.on('clientUpdateOpenChat', this.onClientUpdateOpenChat);

        AppStore.on('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        AppStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        AppStore.on('clientUpdatePageWidth', this.onClientUpdatePageWidth);
        AppStore.on('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        AppStore.on('clientUpdateForward', this.onClientUpdateForward);
        InstantViewStore.on('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        PlayerStore.on('clientUpdatePictureInPicture', this.onClientUpdatePictureInPicture);
    }

    componentWillUnmount() {
        TdLibController.off('update', this.onUpdateNewPermission);
        UserStore.off('clientUpdateOpenUser', this.onClientUpdateOpenUser);
        ChatStore.off('clientUpdateOpenChat', this.onClientUpdateOpenChat);

        AppStore.off('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        AppStore.off('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
        AppStore.off('clientUpdatePageWidth', this.onClientUpdatePageWidth);
        AppStore.off('clientUpdateProfileMediaViewerContent', this.onClientUpdateProfileMediaViewerContent);
        AppStore.off('clientUpdateForward', this.onClientUpdateForward);
        InstantViewStore.off('clientUpdateInstantViewContent', this.onClientUpdateInstantViewContent);
        PlayerStore.off('clientUpdatePictureInPicture', this.onClientUpdatePictureInPicture);
    }

    componentWillReceiveProps(nextProps) {
        this.onGetPermission(nextProps.chatId);
        this.onSetDocumentTitle();
    }

    onSetDocumentTitle = () =>{
        let user = UserStore.get(UserStore.getMyId())  
        if(user){
            // let phone = user.phone_number;
            // let newPhone = ''; 
            // if(phone.length >= 13){
            //     newPhone = phone.slice(2);
            // } 
            let title = "GaGaChat Web " + user.first_name + " " + user.last_name;   
            document.title = title; 
        }  
    }

    onGetPermission = (getChatId) =>{ 
        if(!getChatId)
            return;
        let that = this;
        //let chatId = 1073742002;   
        const chatId1 = getChatId;  
        let chatId = Math.abs(chatId1);
        chatId = chatId.toString(); 
        chatId = chatId.slice(3); 
        chatId = parseInt(chatId); 
        let getAdmin = isAdmin(chatId1);
        that.setState({admin:getAdmin});
        TdLibController.send({
        '@type': 'sendCustomRequest',
        "method": "chats.getBannedRightex",
        "parameters":JSON.stringify({"chatId": chatId})
        })
        .then(data => { 
            if(data.result){
                let newResult = JSON.parse(data.result);  
                 that.setState({permissions:newResult.data ? newResult.data:{}})   
               
            } 
        })
        .catch(err => {  
            console.log("err on get permissions");
        });  
    }

    onClientUpdatePictureInPicture = update => {
        const { videoInfo } = update;

        this.setState({
            videoInfo
        });
    };

    onClientUpdatePageWidth = update => {
        const { isSmallWidth } = update;

        this.setState({ isSmallWidth });
    };

    onClientUpdateInstantViewContent = update => {
        const { content } = update;

        this.setState({
            instantViewContent: content
        });
    };

    onClientUpdateOpenChat = update => {
        const { chatId, messageId, popup, options } = update;
        this.onGetPermission(chatId);
        this.handleSelectChat(chatId, messageId, popup, options || AppStore.chatSelectOptions);
    };

    onClientUpdateOpenUser = update => {
        const { userId, popup } = update; 
        this.handleSelectUser(userId, popup);
    };

    onClientUpdateChatDetailsVisibility = update => {
        const { isChatDetailsVisible } = AppStore;

        this.setState({ isChatDetailsVisible });
    };

    onClientUpdateMediaViewerContent = update => {
        const { mediaViewerContent } = AppStore;

        this.setState({ mediaViewerContent });
    };

    onClientUpdateProfileMediaViewerContent = update => {
        const { profileMediaViewerContent } = AppStore;

        this.setState({ profileMediaViewerContent });
    };

    onClientUpdateForward = update => {
        const { info } = update;

        this.setState({ forwardInfo: info });
    };

    onUpdateNewPermission = update => { 
        switch (update['@type']) {
         case'updateNewCustomEvent': { 
 
             let event =JSON.parse(update.event);
             if(event.action === "chats.rights.onUpdate"){
                let permissions = event.data;
                this.setState({permissions:permissions})  
             } 
         }
         default:
             break;
         }
     }

    handleSelectChat = (chatId, messageId = null, popup = false, options = {}) => {
        const currentChatId = AppStore.getChatId();
        const currentDialogChatId = AppStore.dialogChatId;
        const currentMessageId = AppStore.getMessageId(); 
        if (popup) {
            let gerPermissions = this.state.permissions;
            let getAdmin = this.state.admin;
            let isShow = false; 
            //获取群成员的扩展权限，判断群组是否限制可以查看个人信息等， 
            //并且判断当前用户是否为管理员，如果是管理员则无视权限随时可以看，如果不是管理员
            //则需要根据群组权限 禁用查看个人信息、私聊等功能
            if(getAdmin){
                isShow = true;
            }else{
                if(gerPermissions){ 
                    if(gerPermissions.banWhisper || gerPermissions.banSendDmMention){
                        isShow = false; 
                    } else{
                        isShow = true;
                    }
                }
            } 
            if (currentDialogChatId !== chatId && isShow === true) {
                TdLibController.clientUpdate({
                    '@type': 'clientUpdateDialogChatId',
                    chatId
                });
            }

            return;
        }

        if (currentChatId === chatId && messageId && currentMessageId === messageId && !options) {
            this.dialogDetailsRef.current.scrollToMessage();
            if (messageId) {
                highlightMessage(chatId, messageId);
            }
        } else if (currentChatId === chatId && !messageId && !options) {
            this.dialogDetailsRef.current.scrollToStart();
        } else {
            TdLibController.setChatId(chatId, messageId, options);
        }
    };

    handleSelectUser = async (userId, popup) => {  
        if (!userId) return;

        const chat = await TdLibController.send({
            '@type': 'createPrivateChat',
            user_id: userId,
            force: true
        });

        this.handleSelectChat(chat.id, null, popup);
    };

    render() {
       
        const {
            instantViewContent,
            isChatDetailsVisible,
            mediaViewerContent,
            profileMediaViewerContent,
            forwardInfo,
            videoInfo,
            isSmallWidth
        } = this.state;

        return (
            <>
                <div
                    className={classNames('page', {
                        'page-small': isSmallWidth,
                        'page-third-column': isChatDetailsVisible
                    })}>
                    <Dialogs />
                    <DialogDetails ref={this.dialogDetailsRef} />
                    {isChatDetailsVisible && <ChatInfo />}
                </div>
                <Actions/>
                {instantViewContent && <InstantViewer {...instantViewContent} />}
                {mediaViewerContent && <MediaViewer {...mediaViewerContent} />}
                {profileMediaViewerContent && <ProfileMediaViewer {...profileMediaViewerContent} />}
                {forwardInfo && <ForwardDialog {...forwardInfo} />}
                {videoInfo && <PipPlayer {...videoInfo}/>}
            </>
        );
    }
}

MainPage.propTypes = {};

const enhance = compose(
    withLanguage,
    withSnackbarNotifications
);

export default enhance(MainPage);
