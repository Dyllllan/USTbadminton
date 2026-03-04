package com.xdu.formteamtalent.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.elasticsearch.client.ClientConfiguration;
import org.springframework.data.elasticsearch.client.elc.ElasticsearchConfiguration;

/**
 * @author akyna
 * @date 04/24 024 10:38 PM
 */
@Configuration
public class ElasticSearchConfig extends ElasticsearchConfiguration {

    @Value("${spring.elasticsearch.uris:http://localhost:9200}")
    private String elasticsearchUris;

    @Override
    public ClientConfiguration clientConfiguration() {
        // 从 uris 解析 host:port，格式如 "http://elasticsearch:9200" 或 "http://localhost:9200"
        String hostPort = elasticsearchUris
                .replace("http://", "")
                .replace("https://", "")
                .trim();
        return ClientConfiguration.builder()
                .connectedTo(hostPort)
                .build();
    }
}
