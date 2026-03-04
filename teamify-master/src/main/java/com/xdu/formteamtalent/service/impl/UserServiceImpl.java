package com.xdu.formteamtalent.service.impl;

import cn.hutool.core.io.FileUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.xdu.formteamtalent.entity.*;
import com.xdu.formteamtalent.mapper.UserMapper;
import com.xdu.formteamtalent.service.*;
import com.xdu.formteamtalent.utils.QrcodeUtil;
import com.xdu.formteamtalent.utils.RedisHelper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class UserServiceImpl extends ServiceImpl<UserMapper, User> implements UserService {

    private final ActivityService activityService;
    private final TeamService teamService;
    private final JoinRequestService joinRequestService;
    private final UATService uatService;
    private final RedisHelper redisHelper;
    private final ElasticsearchOperations elasticsearchOperations;

    @Value("${staticPath:./data/}")
    private String staticPath;

    @Autowired
    public UserServiceImpl(ActivityService activityService,
                           TeamService teamService,
                           JoinRequestService joinRequestService,
                           UATService uatService,
                           RedisHelper redisHelper,
                           ElasticsearchOperations elasticsearchOperations) {
        this.activityService = activityService;
        this.teamService = teamService;
        this.joinRequestService = joinRequestService;
        this.uatService = uatService;
        this.redisHelper = redisHelper;
        this.elasticsearchOperations = elasticsearchOperations;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void deleteAccountWithCascade(String userId) {
        User user = getById(userId);
        if (user == null) {
            redisHelper.removeUserCacheByUId(userId);
            return;
        }

        List<Activity> myActivities = activityService.list(
                new QueryWrapper<Activity>().select("a_id").eq("a_holder_id", userId));
        for (Activity a : myActivities) {
            String qrcodePath = QrcodeUtil.getQrcodeRealPathByAId(a.getAId());
            if (FileUtil.exist(qrcodePath)) FileUtil.del(qrcodePath);
            try {
                elasticsearchOperations.delete(a.getAId(), Activity.class);
            } catch (Exception e) {
                log.warn("ES 删除活动失败: {}", e.getMessage());
            }
            joinRequestService.remove(new QueryWrapper<JoinRequest>().eq("a_id", a.getAId()));
            uatService.remove(new QueryWrapper<UAT>().eq("a_id", a.getAId()));
            teamService.remove(new QueryWrapper<Team>().eq("a_id", a.getAId()));
            activityService.removeById(a.getAId());
            redisHelper.removeActivityCacheByAId(a.getAId());
        }

        List<Team> myTeams = teamService.list(
                new QueryWrapper<Team>().select("t_id").eq("t_leader_id", userId));
        Set<String> teamIdSet = new HashSet<>();
        for (Team t : myTeams) teamIdSet.add(t.getTId());
        for (String tId : teamIdSet) {
            joinRequestService.remove(new QueryWrapper<JoinRequest>().eq("t_id", tId));
            uatService.remove(new QueryWrapper<UAT>().eq("t_id", tId));
            teamService.removeById(tId);
        }

        joinRequestService.remove(new QueryWrapper<JoinRequest>().eq("from_id", userId));
        joinRequestService.remove(new QueryWrapper<JoinRequest>().eq("to_id", userId));
        uatService.remove(new QueryWrapper<UAT>().eq("u_id", userId));

        if (user.getUAvatar() != null && user.getUAvatar().startsWith("/avatar/")) {
            String fileName = user.getUAvatar().substring(user.getUAvatar().lastIndexOf("/") + 1);
            String avatarPath = staticPath + "avatar/" + fileName;
            if (FileUtil.exist(avatarPath)) FileUtil.del(avatarPath);
        }

        removeById(userId);
        redisHelper.removeUserCacheByUId(userId);
        log.info("用户 {} 已注销", userId);
    }
}
