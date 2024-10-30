/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next';
import Checkbox from '@material-ui/core/Checkbox';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Typography from '@material-ui/core/Typography';
import Notifications from '../ColumnMiddle/Notifications';
import './SetNickname.css';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { modalManager } from '../../Utils/Modal';
import TextField from '@material-ui/core/TextField';
import UserStore from '../../Stores/UserStore';
import PropTypes from 'prop-types';
import TdLibController from '../../Controllers/TdLibController';
import { getSupergroupId } from '../../Utils/Chat';
import AppStore from '../../Stores/ApplicationStore';
class SetNickname extends Notifications {
    constructor(props) {
        super(props);
        this.state = {
            nicknameDialog: false,
            nickname: "",
            prevNickname: "",
            editNickname: ""
        };
    }

    onOpenNicknameDialog = () => {
        this.setState({ nicknameDialog: true }); 
        this.onGetUsername();
    }
    onGetUsername = () => { 
        const chatId = AppStore.getChatId(); 
        let uid = UserStore.getMyId(); 
        TdLibController.send({
            '@type': 'getChatMember',
            "chat_id": chatId,
            "user_id": uid,
        }).then(data => {
            this.setState({ editNickname: data.nickname });
        }).catch(err => {
        });
    }
    onCloseNicknameDialog = () => {
        this.setState({ nicknameDialog: false });
    }

    onChangeNickname = (event) => {
        this.setState({ editNickname: event.target.value });
    }

    onSaveNickname = (enent) => {
        const { editNickname } = this.state;
        const chatId = AppStore.getChatId();
        const supergroupId = getSupergroupId(chatId);
        TdLibController.send({
            '@type': 'sendCustomRequest',
            "method": "chats.setNickname",
            "parameters": JSON.stringify({ "chatId": supergroupId, nickname: editNickname })
        })
            .then(data => {
                this.setState({nickname:editNickname});
                this.onCloseNicknameDialog();
            })
            .catch(err => {
                console.log("err on get permissions");
            });
    }

    static getDerivedStateFromProps(props, state) {
        if (props.nickname != state.prevNickname) {
            // let user = UserStore.get(UserStore.getMyId())  
            // let nickname = "";
            // if(user){ 
            //     nickname = user.first_name;    
            // }   
            return {
                nickname: props.nickname,
                prevNickname: props.nickname,
            };
        }
        return null;
    }

    render() {
        const { nicknameDialog, nickname, editNickname } = this.state; 
        return (
            <>
                <ListItem style={{paddingRight:0}} className='list-item-rounded' alignItems='flex-start' onClick={this.handleOpenChat}>

                    <div style={{ paddingLeft: 40, width: '100%' }} className="left_right_align">
                        <div className='allCenter'>
                            我在本群的昵称
                        </div>
                        <Button onClick={this.onOpenNicknameDialog} color="secondary">{nickname}&nbsp;&gt;</Button>
                    </div>
                </ListItem>

                <Dialog
                    manager={modalManager}
                    transitionDuration={0}
                    open={nicknameDialog}
                    onClose={this.onCloseNicknameDialog}
                    aria-labelledby='fatal-error-dialog-title'
                    aria-describedby='fatal-error-dialog-description'>
                    <DialogTitle id='fatal-error-dialog-title'>我在本群的昵称</DialogTitle>
                    <DialogContent>
                        <TextField
                            helperText="昵称修改后，只会在此群内显示，群里成员都可以看见"
                            defaultValue={editNickname}
                            multiline
                            onChange={this.onChangeNickname}
                            variant="outlined" />
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={this.onSaveNickname} color='primary' autoFocus>
                            保存
                        </Button>
                        <Button onClick={this.onCloseNicknameDialog} color='primary'>
                            关闭
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }
}
SetNickname.propTypes = {
    nickname: PropTypes.string.isRequired,
};
export default withTranslation()(SetNickname);
