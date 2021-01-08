const Router = require("koa-router");
const { query } = require("../../db/mysql/DBHelper"); //引入异步查询方法
const {
  CREATE_DB,
  USE_DB,
  SELECT_DATABASE,
  DELETE_DB,
  SHOW_ALL_TABLE,
  CREATE_TABLE,
  DROP_TABLE,
  ADD_COLUM,
  DROP_COLUM,
} = require("../../utility/utilityMysql"); //部分引入sql库
/* 数据库相关接口 */
const mysqlRouter = new Router({
  prefix: "initMysql/",
});
let responseBody = {
  code: 1,
  message: "请求成功",
  data: [],
};
// 创建数据
mysqlRouter.post("createDataBase", async (ctx) => {
  let { code, message, data } = responseBody;
  message = "创建成功";
  if (!ctx.body.dbName) {
    code = 0;
    message = "请输入创建的数据库名字";
  } else {
    try {
      // 创建数据库
      await query(CREATE_DB(ctx.body.dbName));
      // 切换数据库
      await query(USE_DB(ctx.body.dbName));
      // 查询当前使用数据库
      data = await query(SELECT_DATABASE);
    } catch (err) {
      code = -1;
      message = "创建失败，请检查库名";
    }
    // 响应体
    ctx.body = {
      code,
      message,
      data,
    };
  }
});
// 获取当前已配置的数据库
mysqlRouter.post("getDataBaseName", async (ctx) => {
  let { code, message, data } = responseBody;
  if (!ctx.body.dbName) {
    code = 0;
    message = "请输入查询的数据库名字";
  } else {
    try {
      // 切换数据库
      await query(USE_DB(ctx.body.dbName));
      // 查询当前使用数据库
      data = await query(SELECT_DATABASE);
    } catch (err) {
      code = -1;
      message = "获取失败，请检查库名";
    }
  }
  // 响应体
  ctx.body = {
    code,
    message,
    data,
  };
});
// 删除数据库
mysqlRouter.post("delDatabase", async (ctx) => {
  let { code, message, data } = responseBody;
  if (!ctx.body.dbName) {
    code = 0;
    message = "请输入删除的数据库名字";
  } else {
    try {
      // 删除指定数据库
      data = await query(DELETE_DB(ctx.body.dbName));
    } catch (err) {
      code = -1;
      message = "删除失败，请检查库名";
    }
  }
  // 响应体
  ctx.body = {
    code,
    message,
    data,
  };
});
/* 数据表相关接口 */
// 获取所有数据表
mysqlRouter.post("getFullTables", async (ctx) => {
  let { code, message, data } = responseBody;
  try {
    data = await query(SHOW_ALL_TABLE);
  } catch (err) {
    code = -1;
    message = "查询失败";
  }
  // 响应体
  ctx.body = {
    code,
    message,
    data,
  };
});
// 添加数据表
mysqlRouter.post("addTable", async (ctx) => {
  let { code, message, data } = responseBody;
  try {
    // 创建表
    await query(CREATE_TABLE(ctx.body.tabName, ctx.body.tabColums));
    // 查询所有表
    data = query(SHOW_ALL_TABLE);
  } catch (err) {
    code = -1;
    message = "建表失败";
  }
  // 响应体
  ctx.body = {
    code,
    message,
    data,
  };
});
// 删除数据表
mysqlRouter.post("delTable", async (ctx) => {
  let { code, message, data } = responseBody;
  try {
    await query(DROP_TABLE(ctx.body.tabName));
    data = await query(SHOW_ALL_TABLE);
  } catch (err) {
    code = -1;
    message = "删除失败";
  }
  // 响应体
  ctx.body = {
    code,
    message,
    data,
  };
});
// 增加字段
mysqlRouter.post("alterTableColum", async (ctx) => {
  let { code, message, data } = responseBody;
  try {
    await query(
      ADD_COLUM(ctx.body.tabName, ctx.body.columnName, ctx.body.columnType)
    );
    data = await query(SHOW_ALL_TABLE);
  } catch (err) {
    code = -1;
    message = "修改失败";
  }
  // 响应体
  ctx.body = {
    code,
    message,
    data,
  };
});
// 删除字段
mysqlRouter.post("dropTableColum", async (ctx) => {
  let { code, message, data } = responseBody;
  try {
    await query(DROP_COLUM(ctx.body.tabName, ctx.body.columnName));
    data = await query(SHOW_ALL_TABLE);
  } catch (err) {
    code = -1;
    message = "删除失败";
  }
  // 响应体
  ctx.body = {
    code,
    message,
    data,
  };
});
module.exports = mysqlRouter;
