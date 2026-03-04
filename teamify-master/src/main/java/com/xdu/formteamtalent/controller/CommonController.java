package com.xdu.formteamtalent.controller;

import com.xdu.formteamtalent.entity.RestfulResponse;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import springfox.documentation.annotations.ApiIgnore;

import java.io.UnsupportedEncodingException;
import java.net.URLDecoder;

@RestController
@RequestMapping("/api")
@ApiIgnore
public class CommonController {
    /**
     * 健康检查，用于验证后端是否正常运行
     * 浏览器访问 http://localhost:8080/api/health 应返回 JSON
     */
    @RequestMapping("/health")
    public RestfulResponse health() {
        return RestfulResponse.success("ok");
    }

    /**
     * 返回错误消息
     *
     * @param code 状态码
     * @param msg  消息
     * @return RestfulResponse
     * @throws UnsupportedEncodingException
     */
    @RequestMapping("/error/{code}/{msg}")
    public RestfulResponse error(@PathVariable Integer code,
                                 @PathVariable String msg) throws UnsupportedEncodingException {
        return RestfulResponse.fail(code, URLDecoder.decode(msg, "UTF-8"));
    }
}
