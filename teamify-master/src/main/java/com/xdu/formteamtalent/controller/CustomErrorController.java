package com.xdu.formteamtalent.controller;

import com.xdu.formteamtalent.entity.RestfulResponse;
import org.springframework.boot.web.servlet.error.ErrorController;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.RequestDispatcher;
import javax.servlet.http.HttpServletRequest;

/**
 * 自定义错误控制器，将 404 等错误转为 JSON 返回，避免 Whitelabel 页面
 */
@RestController
public class CustomErrorController implements ErrorController {

    @RequestMapping(value = "/error", produces = MediaType.APPLICATION_JSON_VALUE)
    public RestfulResponse handleError(HttpServletRequest request) {
        Integer statusCode = (Integer) request.getAttribute(RequestDispatcher.ERROR_STATUS_CODE);
        if (statusCode == null) {
            statusCode = 500;
        }
        String message = (String) request.getAttribute(RequestDispatcher.ERROR_MESSAGE);
        if (message == null || message.isEmpty()) {
            if (statusCode == 404) {
                message = "请求的接口不存在，请检查 URL 是否正确";
            } else {
                message = "服务器错误，请重试";
            }
        }
        return RestfulResponse.fail(statusCode, message);
    }
}
