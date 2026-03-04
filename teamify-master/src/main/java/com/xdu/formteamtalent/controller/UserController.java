package com.xdu.formteamtalent.controller;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.xdu.formteamtalent.entity.*;
import com.xdu.formteamtalent.entity.RestfulResponse;
import com.xdu.formteamtalent.service.*;
import com.xdu.formteamtalent.utils.JwtUtil;
import com.xdu.formteamtalent.utils.AuthUtil;
import com.xdu.formteamtalent.utils.RedisHelper;
import cn.hutool.core.io.FileUtil;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;

@RestController
@Slf4j
@RequestMapping("/api/user")
@Api(tags = "用户操作接口")
/**
 * 用户操作接口
 */
public class UserController {
    private final JoinRequestService joinRequestService;
    private final TeamService teamService;
    private final ActivityService activityService;
    private final UATService uatService;
    private final UserService userService;
    private final RedisHelper redisHelper;
    private final ElasticsearchOperations elasticsearchOperations;
    private final EmailService emailService;

    @Value("${staticPath:./data/}")
    private String staticPath;

    @Autowired
    public UserController(JoinRequestService joinRequestService,
                          TeamService teamService,
                          ActivityService activityService,
                          UATService uatService,
                          UserService userService,
                          RedisHelper redisHelper,
                          ElasticsearchOperations elasticsearchOperations,
                          EmailService emailService) {
        this.joinRequestService = joinRequestService;
        this.teamService = teamService;
        this.activityService = activityService;
        this.uatService = uatService;
        this.userService = userService;
        this.redisHelper = redisHelper;
        this.elasticsearchOperations = elasticsearchOperations;
        this.emailService = emailService;
    }

    /**
     * web 端验证用户
     *
     * @param user  用户
     * @param check 若值为 1 则验证 token 是否合格
     * @param req
     * @param resp
     * @return RestfulResponse
     */
    @PostMapping("/auth")
    @ApiOperation(value = "web 端验证用户", notes = "验证用户, 如果携带了 token 则验证 token, 否则验证请求体中的用户 id 和密码")
    public RestfulResponse auth(@RequestBody @ApiParam(value = "用户") User user,
                                @RequestParam(value = "check", defaultValue = "0") @ApiParam(value = "是否携带 token, 1 是 | 0 否, 默认为否", required = true) String check,
                                HttpServletRequest req,
                                HttpServletResponse resp) {
        if (check.equals("1")) {
            log.info("用户携带 token 进行访问");
            if (AuthUtil.checkToken(req)) return RestfulResponse.success();
            else return RestfulResponse.fail(401, "token验证错误");
        }
        log.info("用户携带用户 id 和密码进行访问");
        if (user.getUId() == null || user.getUPwd() == null) {
            return RestfulResponse.fail(404, "缺失字段值");
        }
        User dbUser = redisHelper.getUserByUId(user.getUId());
        if (dbUser == null) {
            log.info("新注册用户: " + user);
            userService.save(user);
        } else {
            if (!dbUser.getUPwd().equals(user.getUPwd())) {
                log.info("密码错误");
                return RestfulResponse.fail(403, "密码错误");
            }
        }
        String token = JwtUtil.createToken(user.getUId());
        resp.setHeader("auth", token);
        resp.setHeader("Access-Control-Expose-Headers", "auth");
        return RestfulResponse.success();
    }

    /**
     * 用于微信小程序端验证
     *
     * @param code  微信授权码
     * @param check 若值为 1 则验证 token 是否合格
     * @param profile 可选，包含 nickName、avatarUrl 用于同步微信头像昵称
     * @param req
     * @param resp
     * @return RestfulResponse
     */
    @PostMapping("/authwx")
    @ApiOperation(value = "用于微信小程序端验证", notes = "验证用户, 如果携带了 token 则验证 token, 否则验证微信授权码")
    public RestfulResponse authwx(@RequestParam(value = "code", defaultValue = "") @ApiParam(value = "微信授权码") String code,
                                  @RequestParam(value = "check", defaultValue = "") @ApiParam(value = "是否携带 token, 1 是 | 0 否", required = true) String check,
                                  @RequestBody(required = false) @ApiParam(value = "微信资料，含 nickName、avatarUrl") java.util.Map<String, String> profile,
                                  HttpServletRequest req,
                                  HttpServletResponse resp) {
        if (check.equals("1")) {
            if (AuthUtil.checkToken(req)) return RestfulResponse.success();
            else return RestfulResponse.fail(401, "token验证错误");
        }
        String openId = AuthUtil.getOpenIdByCode(code);
        if (openId != null) {
            User user = redisHelper.getUserByUId(openId);
            if (user == null) {
                // 新用户：必须提供微信头像昵称才能注册，否则返回需要注册
                boolean hasProfile = profile != null
                        && ((profile.get("nickName") != null && !profile.get("nickName").isEmpty())
                        || (profile.get("avatarUrl") != null && !profile.get("avatarUrl").isEmpty()));
                if (!hasProfile) {
                    return RestfulResponse.fail(403, "need_register");
                }
                user = new User();
                user.setUName(profile.get("nickName") != null ? profile.get("nickName") : "wx-user");
                user.setUAvatar(profile.get("avatarUrl"));
                user.setUSex("other");
                user.setUId(openId);
                userService.save(user);
            } else {
                // 更新已有用户的头像昵称
                boolean needUpdate = false;
                if (profile != null && profile.get("nickName") != null && !profile.get("nickName").isEmpty()) {
                    user.setUName(profile.get("nickName"));
                    needUpdate = true;
                }
                if (profile != null && profile.get("avatarUrl") != null && !profile.get("avatarUrl").isEmpty()) {
                    user.setUAvatar(profile.get("avatarUrl"));
                    needUpdate = true;
                }
                if (needUpdate) {
                    userService.updateById(user);
                    redisHelper.removeUserCacheByUId(openId);
                }
            }
            String token = JwtUtil.createToken(openId);
            resp.setHeader("auth", token);
            resp.setHeader("Access-Control-Expose-Headers", "auth");
            return RestfulResponse.success();
        } else {
            return RestfulResponse.fail_500();
        }
    }

    /**
     * 更新用户信息
     *
     * @param request
     * @param user
     * @return RestfulResponse
     */
    @PostMapping("/update")
    @ApiOperation(value = "更新用户信息")
    public RestfulResponse update(HttpServletRequest request, @RequestBody @ApiParam(value = "用户", required = true) User user) {
        String userId = AuthUtil.getUserId(request);
        LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper<User>().eq(User::getUId, userId);
        if (user.getUName() != null) wrapper.set(User::getUName, user.getUName());
        if (user.getUSex() != null) wrapper.set(User::getUSex, user.getUSex());
        if (user.getUSchool() != null) wrapper.set(User::getUSchool, user.getUSchool());
        if (user.getUStuNum() != null) wrapper.set(User::getUStuNum, user.getUStuNum());
        if (user.getUMajor() != null) wrapper.set(User::getUMajor, user.getUMajor());
        if (user.getUAvatar() != null) wrapper.set(User::getUAvatar, user.getUAvatar());
        userService.update(wrapper);
        redisHelper.removeUserCacheByUId(userId);
        return RestfulResponse.success();
    }

    /**
     * 发送邮箱验证码（仅支持 @connect.ust.hk 格式）
     */
    @PostMapping("/email/sendCode")
    @ApiOperation(value = "发送邮箱验证码")
    public RestfulResponse sendEmailCode(HttpServletRequest request,
                                        @RequestBody @ApiParam(value = "邮箱") java.util.Map<String, String> body) {
        if (!AuthUtil.checkToken(request)) {
            return RestfulResponse.fail(401, "登录已过期或未登录");
        }
        String email = body != null ? body.get("email") : null;
        if (email == null || email.trim().isEmpty()) {
            return RestfulResponse.fail(400, "请输入邮箱");
        }
        if (!EmailService.isValidUstEmail(email)) {
            return RestfulResponse.fail(400, "邮箱格式错误，仅支持 @connect.ust.hk 格式");
        }
        try {
            emailService.sendVerificationCode(email.trim());
            return RestfulResponse.success();
        } catch (IllegalStateException e) {
            return RestfulResponse.fail(429, e.getMessage());
        } catch (IllegalArgumentException e) {
            return RestfulResponse.fail(400, e.getMessage());
        } catch (Exception e) {
            log.error("发送验证码失败: {}", e.getMessage());
            return RestfulResponse.fail(500, "发送失败，请稍后重试");
        }
    }

    /**
     * 验证邮箱并绑定到当前用户
     */
    @PostMapping("/email/verify")
    @ApiOperation(value = "验证邮箱并绑定")
    public RestfulResponse verifyEmail(HttpServletRequest request,
                                      @RequestBody @ApiParam(value = "邮箱与验证码") java.util.Map<String, String> body) {
        if (!AuthUtil.checkToken(request)) {
            return RestfulResponse.fail(401, "登录已过期或未登录");
        }
        String userId = AuthUtil.getUserId(request);
        if (userId == null || userId.trim().isEmpty()) {
            return RestfulResponse.fail(401, "未登录或登录已过期");
        }
        String email = body != null ? body.get("email") : null;
        String code = body != null ? body.get("code") : null;
        if (email == null || email.trim().isEmpty() || code == null || code.trim().isEmpty()) {
            return RestfulResponse.fail(400, "请输入邮箱和验证码");
        }
        if (!EmailService.isValidUstEmail(email)) {
            return RestfulResponse.fail(400, "邮箱格式错误，仅支持 @connect.ust.hk 格式");
        }
        if (!emailService.verifyCode(email.trim(), code.trim())) {
            return RestfulResponse.fail(400, "验证码错误或已过期");
        }
        User exist = userService.getOne(new QueryWrapper<User>().eq("u_email", email.trim().toLowerCase()));
        if (exist != null && !exist.getUId().equals(userId)) {
            return RestfulResponse.fail(400, "该邮箱已被其他账号绑定");
        }
        LambdaUpdateWrapper<User> wrapper = new LambdaUpdateWrapper<User>()
                .eq(User::getUId, userId)
                .set(User::getUEmail, email.trim().toLowerCase())
                .set(User::getUEmailVerified, 1);
        userService.update(wrapper);
        redisHelper.removeUserCacheByUId(userId);
        return RestfulResponse.success();
    }

    /**
     * 上传用户头像
     *
     * @param request
     * @param file 头像图片文件
     * @return RestfulResponse 数据对象为头像访问 URL
     */
    @PostMapping("/avatar/upload")
    @ApiOperation(value = "上传用户头像")
    public RestfulResponse uploadAvatar(HttpServletRequest request,
                                        @RequestParam("file") @ApiParam(value = "头像文件", required = true) MultipartFile file) {
        if (file.isEmpty()) {
            return RestfulResponse.fail(400, "请选择头像文件");
        }
        String userId = AuthUtil.getUserId(request);
        String avatarDir = staticPath + "avatar/";
        File dir = new File(avatarDir);
        if (!dir.exists()) {
            dir.mkdirs();
        }
        String ext = file.getOriginalFilename();
        if (ext != null && ext.contains(".")) {
            ext = ext.substring(ext.lastIndexOf("."));
        } else {
            ext = ".jpg";
        }
        String fileName = userId + ext;
        File dest = new File(avatarDir + fileName);
        try {
            file.transferTo(dest);
            String avatarUrl = "/avatar/" + fileName;
            User user = redisHelper.getUserByUId(userId);
            if (user != null) {
                user.setUAvatar(avatarUrl);
                userService.updateById(user);
                redisHelper.removeUserCacheByUId(userId);
            }
            return RestfulResponse.success(avatarUrl);
        } catch (IOException e) {
            log.error("头像上传失败: {}", e.getMessage());
            return RestfulResponse.fail(500, "头像上传失败");
        }
    }

    /**
     * 退出某个小组（活动）
     *
     * @param request
     * @param tId     小组 id
     * @return RestfulResponse
     */
    @PostMapping("/leave/team")
    @ApiOperation(value = "退出某个小组（活动）")
    public RestfulResponse leaveTeam(HttpServletRequest request, @RequestParam("tId") @ApiParam(value = "小组编号", required = true) String tId) {
        String uId = AuthUtil.getUserId(request);
        QueryWrapper<UAT> wrapper = new QueryWrapper<>();
        wrapper.eq("t_id", tId);
        wrapper.eq("u_id", uId);
        uatService.remove(wrapper);
        return RestfulResponse.success();
    }

    /**
     * 获取用户信息
     *
     * @param request
     * @return RestfulResponse 数据对象为单个用户对象
     */
    @GetMapping("/get/info")
    @ApiOperation(value = "获取用户信息")
    public RestfulResponse getUserInfo(HttpServletRequest request) {
        log.debug("getUserInfo request: {}", request.getRequestURI());
        return RestfulResponse.success(redisHelper.getUserByUId(AuthUtil.getUserId(request)));
    }

    /**
     * 注销账号，删除用户及所有关联数据
     *
     * @param request
     * @return RestfulResponse
     */
    @PostMapping("/delete/account")
    @ApiOperation(value = "注销账号")
    public RestfulResponse deleteAccount(HttpServletRequest request) {
        if (!AuthUtil.checkToken(request)) {
            return RestfulResponse.fail(401, "登录已过期或未登录");
        }
        String userId = AuthUtil.getUserId(request);
        if (userId == null || userId.trim().isEmpty()) {
            return RestfulResponse.fail(401, "未登录或登录已过期");
        }
        userService.deleteAccountWithCascade(userId);
        return RestfulResponse.success();
    }
}
