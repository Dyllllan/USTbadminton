package com.xdu.formteamtalent.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.xdu.formteamtalent.entity.User;

public interface UserService extends IService<User> {
    /**
     * 注销账号，级联删除用户及所有关联数据
     * @param userId 用户 ID（openId）
     */
    void deleteAccountWithCascade(String userId);
}
