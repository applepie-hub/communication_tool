/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { withTranslation } from 'react-i18next'; 
import AppStore from '../../Stores/ApplicationStore';
import ChatStore from '../../Stores/ChatStore';  
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent'; 
import DialogTitle from '@material-ui/core/DialogTitle';
import Button from '@material-ui/core/Button';
import { modalManager } from '../../Utils/Modal'; 
import Switch from '@material-ui/core/Switch';
import Divider from '@material-ui/core/Divider';
import PropTypes from 'prop-types';

class permissionsDialog extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
          openDialogs: false,
          permissionsDialog:false,
          checkedPublic:false, 
          defaultPublic:false
        }; 
    }   

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const {onCancel, open } = this.props;   
        if (nextProps.onCancel !== onCancel) {
            return true;
        }

        if (nextProps.open !== open) {
            return true;
        }

        return false;
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        const { defaultText, defaultUrl, open } = this.props; 
    }
 
     handleChangePublic = (event) => {
        // let checked = event.target.checked;
        // const chatId = AppStore.getChatId();
        // TdLibController.send({
        //     '@type': 'toggleChannelPublic',
        //     supergroup_id: chatId, 
        //     is_public:checked
        // }).then(result =>{
        //    debugger
        // }).finally(data => {
        //     debugger
        // }).catch(e => {
        //      debugger
        // }); 
      };
  

    render() {
        const { open} = this.props;  
        if (!open) return null;
       
        return (
            <>
            <Dialog
                    manager={modalManager}
                    transitionDuration={0}
                    open={true}
                    onClose={this.onCloseDialog}
                    aria-labelledby='fatal-error-dialog-title'
                    aria-describedby='fatal-error-dialog-description'>
                    <DialogTitle id='fatal-error-dialog-title'>权限管理</DialogTitle>
                    <DialogContent>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                设置为公开群
                            </div>    
                            <Switch />
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                群成员禁言
                            </div>    
                            <Switch  />
                        </div>
                        <div class="left_right_align mgb_4"> 
                            <div class="allCenter mgr_30">
                                被禁言成员列表
                            </div>    
                            <div>
                                <Button color="secondary">&gt;</Button>
                            </div>
                        </div>
                        <Divider />
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                禁止发送媒体
                            </div>
                            <Switch  />
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                禁止发送链接
                            </div>    
                            <Switch  />
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                禁止发送二维码
                            </div>    
                            <Switch  />
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                禁止发送DM消息
                            </div>    
                            <Switch  />
                        </div>
                        <div class="left_right_align mgb_4" > 
                            <div class="allCenter mgr_30">
                                屏蔽敏感词管理
                            </div>    
                            <div>
                                <Button color="secondary">&gt;</Button>
                            </div>
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                发送敏感词移除群聊
                            </div>    
                            <Switch  />
                        </div>
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                敏感词移除群聊提示
                            </div>    
                            <Switch  />
                        </div> 
                        <Divider />
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                群成员可邀请好友进群
                            </div>    
                            <Switch  />
                        </div> 
                        <div class="left_right_align"> 
                            <div class="allCenter mgr_30">
                                禁止加好友、私聊
                            </div>    
                            <Switch  />
                        </div> 
                    </DialogContent>  
                    <DialogActions> 
                        <Button onClick={this.onCloseDialog} color='primary' autoFocus>
                            关闭
                        </Button>
                    </DialogActions>
                </Dialog>
          
              
            </>
        );
    }
}
permissionsDialog.propTypes = {
    open: PropTypes.bool, 
    onCancel: PropTypes.func.isRequired
};
export default withTranslation()(permissionsDialog);
