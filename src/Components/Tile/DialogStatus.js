/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { getChatSubtitleWithoutTyping, isAccentChatSubtitleWithoutTyping } from '../../Utils/Chat';
import ChatStore from '../../Stores/ChatStore';
import UserStore from '../../Stores/UserStore';
import BasicGroupStore from '../../Stores/BasicGroupStore';
import SupergroupStore from '../../Stores/SupergroupStore';
import './DialogStatus.css';
import TdLibController from '../../Controllers/TdLibController';
import AppStore from '../../Stores/ApplicationStore';
import {isPrivateChat } from '../../Utils/Chat';
class DialogStatus extends React.Component {
    constructor(props) {
        super(props);

        const { chatId } = this.props;

        this.state = {
            prevChatId: chatId,
            subtitle: getChatSubtitleWithoutTyping(chatId),
            isAccent: isAccentChatSubtitleWithoutTyping(chatId),
            online_member_count:0,
        };
    }

    static getDerivedStateFromProps(props, state) {
        if (props.chatId !== state.prevChatId) {
            const { chatId } = props;

            return {
                prevChatId: chatId,
                subtitle: getChatSubtitleWithoutTyping(chatId),
                isAccent: isAccentChatSubtitleWithoutTyping(chatId)
            };
        }

        return null;
    }

    shouldComponentUpdate(nextProps, nextState) {
        const { chatId } = this.props;
        const { subtitle, isAccent } = this.state;

        if (nextProps.chatId !== chatId) {
            return true;
        }

        if (nextState.subtitle !== subtitle) {
            return true;
        }

        if (nextState.isAccent !== isAccent) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        UserStore.on('updateUserStatus', this.onUpdateUserStatus);
        BasicGroupStore.on('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.on('updateSupergroup', this.onUpdateSupergroup);
        UserStore.on('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.on('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.on('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        TdLibController.on('update', this.onReceiveUpdateNewPermission);
    }

    componentWillUnmount() {
        UserStore.off('updateUserStatus', this.onUpdateUserStatus);
        BasicGroupStore.off('updateBasicGroup', this.onUpdateBasicGroup);
        SupergroupStore.off('updateSupergroup', this.onUpdateSupergroup);
        UserStore.off('updateUserFullInfo', this.onUpdateUserFullInfo);
        BasicGroupStore.off('updateBasicGroupFullInfo', this.onUpdateBasicGroupFullInfo);
        SupergroupStore.off('updateSupergroupFullInfo', this.onUpdateSupergroupFullInfo);
        TdLibController.off('update', this.onReceiveUpdateNewPermission); 
    }

     //从服务器端接收  权限更新的推送。
     onReceiveUpdateNewPermission = update => {   
        switch (update['@type']) {
            case 'updateChatPermissions':
               
                break;
            case'updateNewCustomEvent': 
                break 
            case 'updateChatOnlineMemberCount': 
                this.setState({online_member_count:update.online_member_count});
                break;
            default:
                break;
            }
     }

    onUpdateUserStatus = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;
        if (!chat.type) return;

        let updateSubtitle = false;
        switch (chat.type['@type']) {
            case 'chatTypeBasicGroup': {
                const fullInfo = BasicGroupStore.getFullInfo(chat.type.basic_group_id);
                if (fullInfo && fullInfo.members) {
                    const member = fullInfo.members.find(x => x.user_id === update.user_id);
                    if (member) {
                        updateSubtitle = true;
                    }
                }
                break;
            }
            case 'chatTypePrivate': {
                if (chat.type.user_id === update.user_id) {
                    updateSubtitle = true;
                }
                break;
            }
            case 'chatTypeSecret': {
                if (chat.type.user_id === update.user_id) {
                    updateSubtitle = true;
                }
                break;
            }
            case 'chatTypeSupergroup': {
                break;
            }
        }

        if (updateSubtitle) {
            this.updateSubtitle(chatId);
        }
    };

    updateSubtitle = chatId => {
        this.setState({
            subtitle: getChatSubtitleWithoutTyping(chatId),
            isAccent: isAccentChatSubtitleWithoutTyping(chatId)
        });
    };

    onUpdateUserFullInfo = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const { type } = chat;
        if (!type) return;

        if (
            type &&
            (type['@type'] === 'chatTypePrivate' || type['@type'] === 'chatTypeSecret') &&
            type.user_id === update.user_id
        ) {
            this.updateSubtitle(chatId);
        }
    };

    onUpdateBasicGroupFullInfo = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const { type } = chat;
        if (!type) return;

        if (type && type['@type'] === 'chatTypeBasicGroup' && type.basic_group_id === update.basic_group_id) {
            this.updateSubtitle(chatId);
        }
    };

    onUpdateSupergroupFullInfo = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const { type } = chat;
        if (!type) return;

        if (type && type['@type'] === 'chatTypeSupergroup' && type.supergroup_id === update.supergroup_id) {
            this.updateSubtitle(chatId);
        }
    };

    onUpdateBasicGroup = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const { type } = chat;
        if (!type) return;

        if (type && type['@type'] === 'chatTypeBasicGroup' && type.basic_group_id === update.basic_group.id) {
            this.updateSubtitle(chatId);
        }
    };

    onUpdateSupergroup = update => {
        const { chatId } = this.props;
        const chat = ChatStore.get(chatId);
        if (!chat) return;

        const { type } = chat;
        if (!type) return;

        if (type && type['@type'] === 'chatTypeSupergroup' && type.supergroup_id === update.supergroup.id) {
            this.updateSubtitle(chatId);
        }
    };

    render() {
        const { subtitle: externalSubtitle } = this.props;
        const { subtitle, isAccent ,online_member_count} = this.state;
        const chatId = AppStore.getChatId();  
        let isPrivateChat00 = false; 
        if (isPrivateChat(chatId)) {
            isPrivateChat00 = true;
        }
        let text = "";
        if(isPrivateChat00){
            text = subtitle;
        }else{
            text = online_member_count + "人在线";
        }
        return (
            <div className={classNames('dialog-status', { 'dialog-status-accent': isAccent })}>
                 
                {externalSubtitle ? externalSubtitle + ', ' : null}
                {text}
                {/* {online_member_count}人在线 */}
            </div>
        );
    }
}

export default DialogStatus;
