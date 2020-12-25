const Router = require("koa-router");
const { query } = require("../../db/mysql/DBHelper"); //引入异步查询方法
const { QUERY_DATAS } = require("../../utility/utilityMysql"); //部分引入sql库
const AES = require("../../utility/cryptoJs");
const redisConf = require("../../db/redis/redisConfig");
const infoRouter = new Router({
  prefix: "/info",
});

infoRouter.get("/getFullInfo", async (ctx) => {
  let query_res = await query(QUERY_DATAS("info")); //异步方法调用
  ctx.body = {
    code: 1,
    data: query_res,
    message: "获取成功",
  };
});
// infoRouter.get("/getRedisPwdForAES", async (ctx) => {
//   let query_res = await query(QUERY_DATAS("config1")); //异步方法调用
//   ctx.body = {
//     data: {
//       query_res,
//       //   a: AES.Encrypt("redis1.q_252"),
//       password: AES.Decrypt(
//         redisConf.password,
//         query_res[0].redisKey,
//         query_res[0].redisIv
//       ),
//     },
//   };
// });
module.exports = infoRouter;
