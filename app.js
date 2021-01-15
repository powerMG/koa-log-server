const Koa = require("koa");
const app = new Koa();
const views = require("koa-views");
const json = require("koa-json");
const onerror = require("koa-onerror");
const bodyparser = require("koa-bodyparser");
const logger = require("koa-logger");
const Router = require("koa-router");
const router = new Router();
/* JWT Import*/
const jwt = require("jsonwebtoken");
const jwtKoa = require("koa-jwt");
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
/* Import Interface File */
const index = require("./routes/index");
const users = require("./routes/users");
const info = require("./routes/interface/info");
const menu = require("./routes/interface/menu");
/* Import Interface File End */
/* Import Databse Conf File */
const baseConf_mysql = require("./routes/dbConfInterface/I_MysqlConf");
/* Import Databse Conf File END*/
let redisClient = null;
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
    path: [/\/api\/login/, /\/api\/test/],
  })
);
// logger
app.use(async (ctx, next) => {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}ms`);
});
// test
router.get("/api/test", async (ctx) => {
  ctx.body = {
    message: "aaa",
    code: 1,
    data: null,
  };
});
/* 登录接口实现 */
router.post("/api/login", async (ctx, next) => {
  const { username, password } = ctx.request.body;
  console.log("userInfo", {username,password});
  // 查询数据库用户信息
  let userInfo = await queryFirst(
    QUERY_DAtAS_WHERE(
      "userinfo",
      `username='${username}' and password='${password}'`
    )
  );
  console.log("userInfo", userInfo);
  // 获取redis配置项
  let redisInfor = await queryFirst(
    QUERY_DAtAS_WHERE("config", `password='${redisConf.password}'`)
  );
  if (userInfo && userInfo.username) {
    let userToken = {
      uid: userInfo.id,
      username: userInfo.username,
      createtime: userInfo.createtime,
      updatetime: userInfo.updatetime,
    };
    // 计算时效到0点的毫秒数(0点后所有token全部失效)
    let _now = new Date();
    let _year = _now.getFullYear();
    let _month = _now.getMonth() + 1;
    let _date = _now.getDate();
    console.log("开始计算令牌有效期", _year, _month, _date);
    let _expiresIn =
      new Date(`${_year}/${_month}/${_date + 1}`).getTime() - new Date();
    console.log("计算结束", _expiresIn);
    // 获取令牌信息
    const token = jwt.sign(userToken, secret, {
      expiresIn: _expiresIn,
    }); //token签名 有效期到0点
    // 存储到redis;
    redisClient = redis.createClient(redisConf.port, redisConf.host);
    let pwd = Decrypt(
      redisConf.password,
      redisInfor.redisKey,
      redisInfor.redisIv
    );
    console.log("redis密码", pwd);
    redisClient.auth(pwd);
    redisClient.on("connect", () => {
      let _key = `token_${userInfo.id}_${userInfo.username}_acess`;
      redisClient.set(_key, token);
      redisClient.expire(_key, _expiresIn); //1小时自动过期
    });
    ctx.body = {
      message: "获取token成功",
      code: 1,
      data: token,
    };
  } else {
    ctx.body = {
      message: "登录失败，用户名不存在",
      code: -1,
      data: null,
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
/* Instantiation Interface */
// test
app.use(index.routes(), index.allowedMethods());
// user
app.use(users.routes(), users.allowedMethods());
// info
app.use(info.routes(), info.allowedMethods());
// menu
app.use(menu.routes(), menu.allowedMethods());
/* Instantiation Interface End */

// error-handling
app.on("error", (err, ctx) => {
  console.log("请求异常");
  let errMsg = {
    code: 500,
    message: "服务忙，请稍等(-9999)",
  };
  if (err.status === 401) {
    errMsg = {
      code: 401,
      message: "无访问权限",
    };
  }
  ctx.res.writeHead(errMsg.code, {
    "content-Type": "application/json;charset=utf-8",
  });
  ctx.res.end(JSON.stringify(errMsg));
});

module.exports = app;
