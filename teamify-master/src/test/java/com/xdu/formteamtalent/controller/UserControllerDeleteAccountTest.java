package com.xdu.formteamtalent.controller;

import com.xdu.formteamtalent.entity.RestfulResponse;
import com.xdu.formteamtalent.service.*;
import com.xdu.formteamtalent.utils.JwtUtil;
import com.xdu.formteamtalent.utils.RedisHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserControllerDeleteAccountTest {

    @Mock
    private JoinRequestService joinRequestService;
    @Mock
    private TeamService teamService;
    @Mock
    private ActivityService activityService;
    @Mock
    private UATService uatService;
    @Mock
    private UserService userService;
    @Mock
    private RedisHelper redisHelper;
    @Mock
    private ElasticsearchOperations elasticsearchOperations;
    @Mock
    private EmailService emailService;

    private UserController userController;

    @BeforeEach
    void setUp() {
        userController = new UserController(
                joinRequestService,
                teamService,
                activityService,
                uatService,
                userService,
                redisHelper,
                elasticsearchOperations,
                emailService
        );
        ReflectionTestUtils.setField(JwtUtil.class, "secret", "unit-test-secret");
        ReflectionTestUtils.setField(JwtUtil.class, "expire", 3600);
    }

    @Test
    void deleteAccount_shouldDelegateToServiceAndReturnSuccess() {
        String userId = "u-delete-1";
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.addHeader("auth", JwtUtil.createToken(userId));

        RestfulResponse response = userController.deleteAccount(request);

        assertEquals(200, response.getCode());
        verify(userService).deleteAccountWithCascade(userId);
    }
}
