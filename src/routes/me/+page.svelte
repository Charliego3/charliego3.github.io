<script lang="ts"></script>

{#snippet list(title: string, classes: string, description: string, items: string[])}
    <span class={`${classes === "" ? "text-md" : classes} font-bold`}>{title}</span>
    {#if description}
        <span>{description}</span>
    {/if}
    <div class="flex flex-col text-sm leading-7 -mt-5">
        {#each items as item}
            <span>• {@html item}</span>
        {/each}
    </div>
{/snippet}

{#snippet link_out()}
    <svg class="text-muted-foreground" xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
       	<path d="M0 0h24v24H0z" fill="none" />
       	<path fill="currentColor" d="M18 7.05a1 1 0 0 0-1-1L9 6a1 1 0 0 0 0 2h5.56l-8.27 8.29a1 1 0 0 0 0 1.42a1 1 0 0 0 1.42 0L16 9.42V15a1 1 0 0 0 1 1a1 1 0 0 0 1-1Z" />
    </svg>
{/snippet}

{#snippet description(title: string, desc: string)}
    <div class="flex flex-col gap-1">
        <span class="text-md font-bold">{title}</span>
        <span class="text-sm">{desc}</span>
    </div>
{/snippet}

<div class="h-full w-full flex items-center justify-center md:overflow-auto">
    <div class="h-full flex flex-col gap-10 px-5 py-8 max-w-4xl text-md leading-[1.7]">
        <div class="font-bold font-sans flex flex-col gap-3">
            <span class="text-5xl">Charlie</span>
            <h1>高级 Java 后端工程师｜交易系统｜高并发｜分布式系统｜容器化与可观测性</h1>
        </div>
        <div class="flex flex-col gap-4 text-sm leading-5">
            <p>9 年后端开发经验，主要使用 Java，具备 Golang 实战经验。长期参与交易、直播等高并发业务系统研发，具备核心业务模块设计与开发、性能优化、分布式系统、容器化部署及线上问题排查经验。</p>
            <p>熟悉 Spring Boot / Spring Cloud 微服务体系，以及 Redis、Kafka、MySQL、Elasticsearch、Cassandra 等基础组件在高并发场景下的应用。具备现货交易系统核心链路及交易撮合外围系统研发经验，熟悉订单、成交、状态流转、资产及账务等相关业务流程。</p>
            <p>具备 Docker / Kubernetes 容器化及 CI/CD 实践经验，参与 Prometheus、Grafana、ELK 等可观测性体系建设，用于系统监控、日志分析及线上问题定位。</p>
            <p class="font-bold text-md">求职方向：高级 Java 后端工程师 / 高级后端工程师</p>
        </div>
        <div class="flex flex-col gap-3">
            <hr/>
            <p class="text-4xl font-bold">个人信息</p>
            <div class="flex gap-2 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 24 24">
                   	<path d="M0 0h24v24H0z" fill="none" />
                   	<path fill="currentColor" fill-rule="evenodd" d="M12 12.635L22 6.86v-.11A2.755 2.755 0 0 0 19.25 4H4.75A2.755 2.755 0 0 0 2 6.75v.11zm4.25 7.615l5-5c.55-.55.55-1.45 0-2s-1.45-.55-2 0l-5 5l-.685 2.05c-.13.39.24.765.63.63l2.05-.685zm1.94-8.06l-5.25 5.25v-.005l-.855 2.56H4.75A2.755 2.755 0 0 1 2 17.245V8.59l10 5.775L22 8.59v3.345a2.91 2.91 0 0 0-3.81.255" clip-rule="evenodd" />
                </svg>
                <a class="flex underline underline-offset-5 hover:text-amber-500 items-center" href="mailto:charlie.go.3@outlook.com">
                    <span>charlie.go.3@outlook.com</span>
                    {@render link_out()}
                </a>
            </div>
            <div class="flex gap-2 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 256 256">
                   	<path d="M0 0h256v256H0z" fill="none" />
                   	<defs>
                  		<linearGradient id="SVG6DaOZcwt" x1="50%" x2="50%" y1="0%" y2="100%">
                 			<stop offset="0%" stop-color="#2aabee" />
                 			<stop offset="100%" stop-color="#229ed9" />
                  		</linearGradient>
                   	</defs>
                   	<path fill="currentColor" d="M128 0C94.06 0 61.48 13.494 37.5 37.49A128.04 128.04 0 0 0 0 128c0 33.934 13.5 66.514 37.5 90.51C61.48 242.506 94.06 256 128 256s66.52-13.494 90.5-37.49c24-23.996 37.5-56.576 37.5-90.51s-13.5-66.514-37.5-90.51C194.52 13.494 161.94 0 128 0" />
                   	<path class="dark:fill-primary-foreground fill-white" d="M57.94 126.648q55.98-24.384 74.64-32.152c35.56-14.786 42.94-17.354 47.76-17.441c1.06-.017 3.42.245 4.96 1.49c1.28 1.05 1.64 2.47 1.82 3.467c.16.996.38 3.266.2 5.038c-1.92 20.24-10.26 69.356-14.5 92.026c-1.78 9.592-5.32 12.808-8.74 13.122c-7.44.684-13.08-4.912-20.28-9.63c-11.26-7.386-17.62-11.982-28.56-19.188c-12.64-8.328-4.44-12.906 2.76-20.386c1.88-1.958 34.64-31.748 35.26-34.45c.08-.338.16-1.598-.6-2.262c-.74-.666-1.84-.438-2.64-.258c-1.14.256-19.12 12.152-54 35.686c-5.1 3.508-9.72 5.218-13.88 5.128c-4.56-.098-13.36-2.584-19.9-4.708c-8-2.606-14.38-3.984-13.82-8.41c.28-2.304 3.46-4.662 9.52-7.072" />
                </svg>
                <a class="flex underline underline-offset-5 hover:text-amber-500 items-center" href="https://t.me/Charliego3" target="_blank">
                    <span>@Charliego3</span>
                    {@render link_out()}
                </a>
            </div>
            <div class="flex gap-2 items-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="1.5em" height="1.5em" viewBox="0 0 256 250">
                   	<path d="M0 0h256v250H0z" fill="none" />
                   	<path fill="currentColor" d="M128.001 0C57.317 0 0 57.307 0 128.001c0 56.554 36.676 104.535 87.535 121.46c6.397 1.185 8.746-2.777 8.746-6.158c0-3.052-.12-13.135-.174-23.83c-35.61 7.742-43.124-15.103-43.124-15.103c-5.823-14.795-14.213-18.73-14.213-18.73c-11.613-7.944.876-7.78.876-7.78c12.853.902 19.621 13.19 19.621 13.19c11.417 19.568 29.945 13.911 37.249 10.64c1.149-8.272 4.466-13.92 8.127-17.116c-28.431-3.236-58.318-14.212-58.318-63.258c0-13.975 5-25.394 13.188-34.358c-1.329-3.224-5.71-16.242 1.24-33.874c0 0 10.749-3.44 35.21 13.121c10.21-2.836 21.16-4.258 32.038-4.307c10.878.049 21.837 1.47 32.066 4.307c24.431-16.56 35.165-13.12 35.165-13.12c6.967 17.63 2.584 30.65 1.255 33.873c8.207 8.964 13.173 20.383 13.173 34.358c0 49.163-29.944 59.988-58.447 63.157c4.591 3.972 8.682 11.762 8.682 23.704c0 17.126-.148 30.91-.148 35.126c0 3.407 2.304 7.398 8.792 6.14C219.37 232.5 256 184.537 256 128.002C256 57.307 198.691 0 128.001 0m-80.06 182.34c-.282.636-1.283.827-2.194.39c-.929-.417-1.45-1.284-1.15-1.922c.276-.655 1.279-.838 2.205-.399c.93.418 1.46 1.293 1.139 1.931m6.296 5.618c-.61.566-1.804.303-2.614-.591c-.837-.892-.994-2.086-.375-2.66c.63-.566 1.787-.301 2.626.591c.838.903 1 2.088.363 2.66m4.32 7.188c-.785.545-2.067.034-2.86-1.104c-.784-1.138-.784-2.503.017-3.05c.795-.547 2.058-.055 2.861 1.075c.782 1.157.782 2.522-.019 3.08m7.304 8.325c-.701.774-2.196.566-3.29-.49c-1.119-1.032-1.43-2.496-.726-3.27c.71-.776 2.213-.558 3.315.49c1.11 1.03 1.45 2.505.701 3.27m9.442 2.81c-.31 1.003-1.75 1.459-3.199 1.033c-1.448-.439-2.395-1.613-2.103-2.626c.301-1.01 1.747-1.484 3.207-1.028c1.446.436 2.396 1.602 2.095 2.622m10.744 1.193c.036 1.055-1.193 1.93-2.715 1.95c-1.53.034-2.769-.82-2.786-1.86c0-1.065 1.202-1.932 2.733-1.958c1.522-.03 2.768.818 2.768 1.868m10.555-.405c.182 1.03-.875 2.088-2.387 2.37c-1.485.271-2.861-.365-3.05-1.386c-.184-1.056.893-2.114 2.376-2.387c1.514-.263 2.868.356 3.061 1.403" />
                </svg>
                <a class="flex underline underline-offset-5 hover:text-amber-500 items-center" href="https://github.com/charliego3" target="_blank">
                    <span>Charliego3</span>
                    {@render link_out()}
                </a>
            </div>
        </div>
        <div class="flex flex-col gap-5">
            <hr/>
            <span class="text-4xl font-bold">核心技术</span>
            {@render list("Java / Spring", "", "", [
                "熟悉 Java 8+，具备面向对象设计、多线程及并发编程能力",
                "熟悉 Spring Boot，具备大型业务系统及微服务后端开发经验",
                "熟悉 Spring Cloud 微服务体系，具备服务注册发现、配置管理、网关及服务治理经验",
                "熟悉 MyBatis / MyBatis-Plus，具备复杂业务数据访问及 SQL 优化经验",
            ])}
            {@render list("交易系统 / 高并发 / 分布式", "", "", [
                "具备现货交易系统核心业务开发经验，熟悉订单、成交、状态流转及交易外围系统处理流程",
                "具备高并发系统设计与开发经验，熟悉缓存、异步化、消息队列、限流、降级等常用方案",
                "熟悉分布式系统中的幂等、状态机、消息重试及最终一致性设计",
                "具备交易及实时消息系统开发经验，关注系统吞吐、延迟、稳定性及可扩展性",
                "具备线上性能问题及稳定性问题定位、分析和优化经验",
            ])}
            {@render list("数据库 / 中间件", "", "", [
                "<span class='font-bold'>MySQL</span>：熟悉索引设计、SQL 优化、事务及分库分表",
                "<span class='font-bold'>Redis</span>：熟悉缓存、热点数据、分布式锁、限流及缓存一致性等场景",
                "<span class='font-bold'>Kafka</span>：熟悉消息生产消费、异步解耦、消息顺序、幂等及重复消费处理",
                "<span class='font-bold'>Elasticsearch</span>：熟悉索引设计、查询及聚合分析",
                "<span class='font-bold'>Cassandra</span>：熟悉数据模型、分区设计及分页查询，具备海量数据存储实践",
            ])}
            {@render list("容器化 / CI/CD / 可观测性", "", "", [
                "熟悉 <span class='font-bold'>Docker / Kubernetes</span>，具备微服务容器化部署及运行维护经验",
                "参与容器编排及服务部署体系建设，熟悉服务扩缩容、资源配置及运行状态管理",
                "熟悉 <span class='font-bold'>Prometheus / Grafana</span>，参与系统指标采集、监控及可视化建设",
                "熟悉 <span class='font-bold'>ELK</span>，具备应用日志集中采集、检索及线上问题分析经验",
                "具备系统监控、日志及运行指标结合的线上问题定位经验",
                "具备 <span class='font-bold'>Jenkins / GitLab CI/CD</span> 实践经验，参与持续集成及自动化发布流程建设",
            ])}
            {@render list("实时通信 / 基础设施", "", "", [
                "熟悉 WebSocket 实时通信及消息推送系统",
                "熟悉 Spring Cloud Gateway，具备网关路由及线上稳定性维护经验"
            ])}
            {@render list("Golang", "", "", [
                "具备 Golang 后端开发经验",
                "使用过 Gin、go-ethereum、sqlc、Kratos、Protobuf 等技术进行业务及区块链相关系统开发"
            ])}
        </div>
        <div class="flex flex-col gap-5">
            <hr/>
            <span class="text-4xl font-bold">工作经历</span>
            <span class="text-xl font-bold">宏丰科技有限公司</span>
            {@render list("Java 开发工程师｜2024.08 - 2026.09", "text-sm", "", [
                "参与直播及短视频系统后端开发，负责直播间管理、弹幕互动、礼物打赏、用户互动等核心业务模块",
                "负责直播平台部分核心业务模块的设计与开发，持续进行系统性能及稳定性优化",
                "参与直播消息分发系统设计与开发，基于 WebSocket + Kafka 构建实时消息推送体系，支持弹幕、礼物、用户进出等实时互动消息",
                "负责直播高并发场景相关处理，通过 Redis、限流、异步队列 等方式提升系统吞吐能力及稳定性",
                "参与礼物打赏及虚拟资产相关业务开发，涉及礼物订单、用户余额扣减及收益结算等核心业务流程",
                "参与直播数据统计及推荐相关模块开发，基于 Kafka 处理直播热度及用户行为数据",
                "基于 Spring Boot + Spring Cloud + MyBatis + Nacos + Gateway 进行微服务系统开发及维护",
                "参与 Docker / Kubernetes 相关容器化部署及服务运行维护，配合业务服务进行环境部署和资源管理",
                "参与 Prometheus + Grafana + ELK 可观测性建设，用于服务运行指标、日志及线上问题分析",
                "协同测试、产品及前端完成需求设计、系统联调及线上问题排查，保障版本稳定交付",
            ])}
            <span class="text-xl font-bold">卓世达科科技有限公司</span>
            {@render list(
                "Java 开发工程师｜2018.02 - 2024.08",
                "text-sm",
                "主要参与交易所及相关业务系统研发，长期负责现货交易相关核心功能开发及维护。",
                [
                    "负责现货交易系统核心业务功能开发与维护，涉及订单校验、撮合处理、成交生成及订单状态流转等核心流程",
                    "负责交易撮合引擎系统建设，撮合结果与订单、资产、账务等相关业务之间的数据处理及系统衔接",
                    "针对高并发交易场景进行接口及业务链路优化，通过减少锁竞争、降低线程阻塞等方式提升系统处理能力",
                    "负责成交结果、订单状态等关键业务事件的异步化及消息化处理，降低核心交易链路与下游系统之间的耦合",
                    "通过幂等控制、状态机及消息补偿机制处理分布式业务场景下的数据一致性问题",
                    "根据业务特点进行订单及成交数据的分库分表，并结合 Redis 缓存降低数据库访问压力",
                    "通过消息队列及事件驱动方式实现交易核心与推送、风控、账务等下游系统之间的解耦",
                    "参与线上问题排查及根因分析，持续优化系统稳定性、可观测性及运行效率",
                    "参与推送系统研发，支持交易相关实时消息及业务事件的异步分发",
                    "熟悉财务系统整体处理流程及核心业务逻辑，参与相关功能开发及问题排查",
                    "参与系统容器化及运行环境建设，使用 Docker 等技术支持业务服务部署与运行",
                    "参与监控、日志及线上问题排查体系建设，使用 Prometheus、Grafana、ELK 等工具辅助系统运行状态监控及问题定位",
                    "使用 Golang 开发 PancakeSwap 对冲系统",
                ]
            )}
            <span class="text-xl font-bold">深圳市四格互联信息技术有限公司</span>
            {@render list("Java 开发工程师｜2017.06 - 2018.02", "text-sm", "", [
                "参与公司内部自动化 SaaS 平台开发，负责基础信息管理、第三方系统对接、搜索及数据导入导出等模块。",
                "技术栈： Spring、Struts2、Hibernate、MySQL、Solr"
            ])}
        </div>
        <div class="flex flex-col gap-5">
            <hr/>
            <span class="text-4xl font-bold">核心项目</span>
            <span class="text-3xl font-bold">中币交易所</span>
            <span class="text-sm font-bold">Java 后端开发工程师｜2018.02 - 2024.08</span>
            <div class="flex flex-col gap-2">
                <span class="text-xl font-bold">项目介绍</span>
                <span class="text-sm">交易所平台包含现货交易、杠杆交易、杠杆借贷、抵押借贷、合约交易及 C2C 等业务。</span>
                <span class="text-sm">本人主要参与现货交易系统及相关外围系统研发，负责交易核心业务链路的后端开发与维护。系统对并发处理能力、数据一致性、实时性及稳定性具有较高要求。</span>
            </div>
            {@render list("核心职责", "text-xl", "", [
                "负责现货交易后端核心业务开发，涉及订单创建、订单校验、撮合结果处理、成交生成及订单状态流转",
                "参与撮合引擎外围系统建设，负责撮合结果与订单、资产、账务等相关系统的数据衔接",
                "负责成交、订单状态等关键业务事件的异步处理及消息分发，为推送及其他下游系统提供事件数据",
                "参与交易系统一致性方案设计，通过幂等、状态机、消息重试及补偿机制处理异常场景",
                "根据业务访问特点对订单、成交等数据进行分库分表，结合 Redis 缓存降低数据库压力",
                "通过事件驱动方式解耦交易核心与推送、风控、账务等外围系统",
                "参与线上问题排查及性能优化，持续提升核心交易链路的稳定性及可维护性",
                "参与交易系统监控、日志及运行状态分析，通过指标、日志等手段辅助线上问题定位",
                "使用 Golang 开发 PancakeSwap 对冲系统",
            ])}
            <span class="text-xl font-bold">核心技术方案</span>
            {@render description("高并发处理", "根据交易业务特点，通过内存队列、消息队列等方式进行异步化及削峰，减少高峰流量对核心服务及数据库的直接冲击。")}
            {@render description("一致性设计", "针对订单、成交及相关业务数据处理过程，通过幂等控制、状态机及消息补偿等机制处理重复请求、消息异常及跨服务数据一致性问题。")}
            {@render description("系统解耦", "通过事件驱动及消息队列将交易核心与推送、风控、账务等系统进行解耦，降低核心交易链路对外围系统的依赖。")}
            {@render description("性能优化", "结合 Redis 缓存、数据库分库分表及并发处理优化，降低数据库压力及线程阻塞，提升高并发场景下的系统处理能力。")}
            {@render description("系统可观测性", "结合 Prometheus、Grafana、ELK 等工具对服务运行指标及日志进行监控和分析，辅助定位接口异常、服务性能问题及线上故障。")}
            {@render description("容器化与部署", "使用 Docker 等容器技术支持业务服务部署及运行，参与 Kubernetes 等容器编排环境下的服务管理及运维协作。")}
            {@render list("技术栈", "text-xl", "", [
                "Java 8 / Spring Boot / Spring Cloud",
                "MyBatis-Plus / MySQL / Redis / MongoDB",
                "Kafka / XXL-JOB",
                "Docker / Kubernetes",
                "Prometheus / Grafana / ELK",
                "Golang / Gin / go-ethereum / sqlc / Kratos / Protobuf",
            ])}
            <span class="text-3xl font-bold">直播系统</span>
            <span class="text-sm font-bold">Java 后端开发工程师｜2024.08 - 2026.09</span>
            <div class="flex flex-col gap-2">
                <span class="text-xl font-bold">项目介绍</span>
                <span class="text-sm">面向大规模用户的 SaaS 直播平台，提供直播开播、观看、弹幕、实时互动、消息推送、游戏、注单及资金服务等功能。</span>
                <span class="text-sm">系统采用微服务架构，需要同时处理大量实时连接及高并发业务请求，并保证消息实时性及核心业务数据的一致性。</span>
            </div>
            {@render list("核心职责", "text-xl", "", [
                "负责直播平台核心业务模块开发，包括直播间管理、在线用户维护及互动消息处理",
                "负责各端 Gateway 服务开发及维护",
                "参与 WebSocket 实时消息系统建设，支持弹幕、礼物、进出房及其他互动消息实时推送",
                "参与基于 Kafka 的消息分发体系建设，处理高吞吐实时业务事件",
                "使用 Redis 存储直播间状态、在线用户等高频访问数据",
                "参与直播高并发场景性能优化，通过缓存、异步队列及限流等方式提升系统稳定性",
                "参与直播数据统计及推荐相关功能开发",
                "参与礼物订单、余额扣减及收益结算等虚拟资产相关业务开发",
                "参与微服务容器化部署及运行维护，配合 Docker / Kubernetes 环境完成服务发布",
                "参与 Prometheus / Grafana 监控及 ELK 日志体系建设，辅助线上服务运行状态监控及问题定位",
            ])}
            <span class="text-xl font-bold">核心技术方案</span>
            {@render description("微服务架构", "基于 Spring Boot + Spring Cloud 构建业务微服务，通过 Nacos、Gateway 等组件实现服务注册、配置及请求路由。")}
            {@render description("实时消息", "基于 WebSocket + Kafka 构建实时消息处理链路，支持弹幕、礼物及用户状态等实时事件分发。")}
            {@render description("高频数据", "使用 Redis 存储直播间状态、在线用户等高频访问数据，并结合数据结构及过期策略控制缓存数据规模。")}
            {@render description("海量数据", "使用 Cassandra 存储直播消息及互动记录等数据，根据业务访问特点设计数据模型及分区策略。")}
            {@render description("搜索及分析", "使用 Elasticsearch 支持直播间搜索、主播检索及部分统计分析场景。")}
            {@render description("可观测性", "通过 Prometheus / Grafana 监控服务运行指标，结合 ELK 对应用日志进行集中收集和检索，辅助线上异常及性能问题定位。")}
            {@render list("技术栈", "text-xl", "", [
                "Java11 / Spring Boot / Spring Cloud",
                "MyBatis-Plus / MySQL",
                "Redis / Kafka",
                "Cassandra / Elasticsearch",
                "WebSocket / Gateway / Nacos",
                "Docker / Kubernetes",
                "Prometheus / Grafana / ELK",
            ])}
        </div>
        <div class="flex flex-col gap-5 pb-8">
            <hr/>
            <span class="text-4xl font-bold">技术特点</span>
            {@render list("", "", "", [
                "<span class='font-bold'>Java 为主要技术方向，具备 9 年后端开发经验</span>",
                "长期参与交易系统及高并发业务系统开发",
                "具备现货交易核心业务及撮合外围系统开发经验",
                "熟悉订单、成交、状态流转、资产及账务等交易相关业务流程",
                "熟悉 Redis、Kafka、MySQL 等基础组件在高并发系统中的应用",
                "具备分布式系统中的幂等、状态机、消息补偿及最终一致性实践经验",
                "具备 Docker / Kubernetes 容器化及服务部署实践",
                "具备 Prometheus / Grafana / ELK 等监控、日志及可观测性实践",
                "具备线上问题定位、性能分析及稳定性优化经验",
                "具备 Golang 业务开发及区块链相关系统开发经验",
            ])}
        </div>
    </div>
</div>
