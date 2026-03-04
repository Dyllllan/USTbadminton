package com.xdu.formteamtalent.service.impl;

import com.xdu.formteamtalent.service.EmailService;
import com.xdu.formteamtalent.utils.RedisHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class EmailServiceImpl implements EmailService {

    private static final String REDIS_CODE_PREFIX = "email:code:";
    private static final String REDIS_SEND_PREFIX = "email:send:";
    private static final int CODE_EXPIRE_SECONDS = 300;  // 5 分钟
    private static final int SEND_INTERVAL_SECONDS = 60; // 60 秒内不能重复发送

    private final JavaMailSender mailSender;
    private final RedisHelper redisHelper;

    @Value("${spring.mail.username:noreply@example.com}")
    private String fromEmail;

    @Value("${email.verification.enabled:true}")
    private boolean emailEnabled;

    @Autowired
    public EmailServiceImpl(@org.springframework.beans.factory.annotation.Autowired(required = false) JavaMailSender mailSender,
                            RedisHelper redisHelper) {
        this.mailSender = mailSender;
        this.redisHelper = redisHelper;
    }

    @Override
    public String sendVerificationCode(String email) {
        if (!EmailService.isValidUstEmail(email)) {
            throw new IllegalArgumentException("邮箱格式错误，仅支持 @connect.ust.hk 格式");
        }
        String code = EmailService.generateCode();
        String redisKey = REDIS_CODE_PREFIX + email.toLowerCase().trim();
        String sendKey = REDIS_SEND_PREFIX + email.toLowerCase().trim();

        // 检查发送间隔
        if (redisHelper.get(sendKey) != null) {
            throw new IllegalStateException("发送过于频繁，请稍后再试");
        }

        if (emailEnabled && this.mailSender != null) {
            try {
                SimpleMailMessage msg = new SimpleMailMessage();
                msg.setFrom(fromEmail);
                msg.setTo(email.trim());
                msg.setSubject("【组队达人】邮箱验证码");
                msg.setText("您的验证码是：" + code + "，5 分钟内有效。如非本人操作请忽略。");
                mailSender.send(msg);
            } catch (Exception e) {
                log.error("发送验证码邮件失败: {}", e.getMessage());
                throw new RuntimeException("邮件发送失败，请稍后重试");
            }
        } else {
            log.info("邮件未配置或已禁用，验证码（开发用）: {} -> {}", email, code);
        }

        redisHelper.setex(redisKey, code, CODE_EXPIRE_SECONDS);
        redisHelper.setex(sendKey, "1", SEND_INTERVAL_SECONDS);
        return code;
    }

    @Override
    public boolean verifyCode(String email, String code) {
        if (email == null || code == null) return false;
        String redisKey = REDIS_CODE_PREFIX + email.toLowerCase().trim();
        String stored = redisHelper.get(redisKey);
        if (stored == null) return false;
        boolean ok = stored.equals(code.trim());
        if (ok) redisHelper.del(redisKey);
        return ok;
    }
}
