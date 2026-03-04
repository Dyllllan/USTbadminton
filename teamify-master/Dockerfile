# 构建阶段：使用 Maven 编译
FROM maven:3.8-eclipse-temurin-8 AS builder
WORKDIR /build

# 复制 pom 和源码
COPY pom.xml .
COPY src ./src

# 编译并打包（跳过测试以加快构建）
RUN mvn clean package -DskipTests -q

# 运行阶段
FROM eclipse-temurin:8-jre
MAINTAINER akynazh

WORKDIR /app

# 从构建阶段复制 jar 包
COPY --from=builder /build/target/form-team-talent.jar ./app.jar

# 数据目录（二维码、头像等）
RUN mkdir -p /app/data

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
