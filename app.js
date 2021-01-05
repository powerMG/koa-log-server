const Koa = require("koa");
const app = new Koa();
const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
const logger = require("koa-logger");
const Router = require("koa-router");
/* test git commit  */
const router = new Router();
/* JWT Import*/
const jwt = require("jsonwebtoken");
const jwtKoa = require("koa-jwt");
const util = require("util");
const verify = util.promisify(jwt.verify); // 解密
const secret = "jwt demo";
/* JWT Import END */
/* Redis Import */
// const session = require("koa-generic-session");
const redis = require("redis");
const redisConf = require("./db/redis/redisConfig");
const { Decrypt } = require("./utility/cryptoJs");
/* Redis Import END */

const { queryFirst } = require("./db/mysql/DBHelper"); //引入异步查询方法
const { QUERY_DAtAS_WHERE } = require("./utility/utilityMysql"); //部分引入sql库

const index = require("./routes/index");
const users = require("./routes/users");
const info = require("./routes/interface/info");
/* Import Databse Conf File */
const baseConf_mysql = require("./routes/dbConfInterface/I_MysqlConf");
/* Import Databse Conf File END*/

// error handler
onerror(app);
// middlewares
app.use(
  bodyparser({
    enableTypes: ["json", "form", "text"],
  })
);
app.use(json());
app.use(logger());
app.use(require("koa-static")(__dirname + "/public"));

app.use(
  views(__dirname + "/views", {
    extension: "pug",
  })
);

app.use(
  jwtKoa({ secret }).unless({
    path: [/\/api\/login/],
  })
);

// app.keys = ["redisKey", "redisKeysKeys"];
// app.use(
//   session({
//     store: redisStore({
//       host: redisConf.host,
//       port: redisConf.port,
//       password: Decrypt(
//         redisConf.password,
//         redisConf.rediskey,
//         redisConf.redisiv
//       ),
//     }),
//   })
// );
// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});
/* 登录接口实现 */
router.post("/api/login", async (ctx, next) => {
  const { username, password } = ctx.request.body;
  // 查询数据库用户信息
  let userInfo = await queryFirst(
    QUERY_DAtAS_WHERE(
      "userinfo",
      `username='${username}' and password='${password}'`
    )
  );
  // 获取redis配置项
  let redisInfor = await queryFirst(
    QUERY_DAtAS_WHERE("config", `password='${redisConf.password}'`)
  );
  if (userInfo && userInfo.username) {
    let userToken = {
      username: userInfo.username,
      createtime: userInfo.createtime,
      updatetime: userInfo.updatetime,
    };
    // 获取令牌信息
    const token = jwt.sign(userToken, secret, { expiresIn: "1h" }); //token签名 有效期为1小时// 存储到redis;
    const client = redis.createClient(redisConf.port, redisConf.host);
    let pwd = Decrypt(
      redisConf.password,
      redisInfor.redisKey,
      redisInfor.redisIv
    );
    console.log("redis密码", pwd);
    client.auth(pwd);
    client.on("connect", () => {
      let _key = `token_${userInfo.id}_${userInfo.username}`;
      client.set(_key, token, (err, data) => {
        console.log(_key);
        console.log(token);
        console.log(err);
        console.log(data);
      });
      client.expire(_key, 3600); //1小时自动过期
    });
    ctx.body = {
      message: "获取token成功",
      code: 1,
      token,
    };
  } else {
    ctx.body = {
      message: "登录失败，用户名不存在",
      code: -1,
    };
  }
});
// .get("/api/userInfo", async (ctx) => {
//   console.log("进入获取用户信息接口");
//   const token = ctx.header.authorization; // 获取jwt
//   let payload;
//   if (token) {
//     payload = await verify(token.split(" ")[1], secret); // // 解密，获取payload
//     ctx.body = {
//       payload,
//     };
//   } else {
//     ctx.body = {
//       message: "token 错误",
//       code: -1,
//     };
//   }
// });
app.use(router.routes()).use(router.allowedMethods());
// 基础配置（mysql数据库基本操作导入）
app.use(baseConf_mysql.routes(), baseConf_mysql.allowedMethods());
// routes
app.use(index.routes(), index.allowedMethods());
app.use(users.routes(), users.allowedMethods());
app.use(info.routes(), info.allowedMethods());

// error-handling
app.on("error", (err, ctx) => {
  console.error("server error", err, ctx);
});

module.exports = app;
