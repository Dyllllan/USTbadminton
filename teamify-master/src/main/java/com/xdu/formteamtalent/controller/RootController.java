package com.xdu.formteamtalent.controller;

import com.xdu.formteamtalent.entity.RestfulResponse;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import springfox.documentation.annotations.ApiIgnore;

/**
 * 根路径，访问 http://localhost:8080/ 时返回提示
 */
@RestController
@ApiIgnore
public class RootController {
    @RequestMapping("/")
    public RestfulResponse root() {
        return RestfulResponse.success("后端运行中，API 前缀 /api，如 /api/health");
    }
}
