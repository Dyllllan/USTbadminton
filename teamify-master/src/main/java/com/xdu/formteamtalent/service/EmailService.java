package com.xdu.formteamtalent.service;

import java.util.concurrent.ThreadLocalRandom;

/**
 * 邮箱验证码服务
 */
public interface EmailService {
    /**
     * 发送验证码到指定邮箱（仅支持 @connect.ust.hk 格式）
     *
     * @param email 邮箱地址
     * @return 验证码（开发环境可返回，生产环境一般不返回）
     */
    String sendVerificationCode(String email);

    /**
     * 校验验证码是否正确
     *
     * @param email 邮箱
     * @param code  验证码
     * @return 是否校验通过
     */
    boolean verifyCode(String email, String code);

    /**
     * 校验邮箱格式是否为 @connect.ust.hk
     */
    static boolean isValidUstEmail(String email) {
        if (email == null || email.trim().isEmpty()) return false;
        return email.trim().toLowerCase().endsWith("@connect.ust.hk");
    }

    /**
     * 生成 6 位数字验证码
     */
    static String generateCode() {
        return String.format("%06d", ThreadLocalRandom.current().nextInt(1000000));
    }
}
