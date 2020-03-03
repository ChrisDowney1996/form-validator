# 表单校验工具
<div align="center">

[![MIT](https://img.shields.io/dub/l/vibe-d.svg?style=flat-square)](http://opensource.org/licenses/MIT)

</div>

一个能在IE5上运行的表单校验工具，支持异步校验

# 浏览器支持
* IE5+
* 现代浏览器
# 使用方法
  - 浏览器
```
<script src="../dist/form-validator.min.js"></script>
	
```
  - 快速开始
```
var formValidator = new FormValidator([
    {
      name: 'required',
      msg: '自定义规则信息',
      validator: function (value, prop, rule) {
        return value != null && value !== ''
      }
    }
  ])
  // 表单字段
  var formModel = {
    title: '',
    age: 17
  }
  // 校验表单字段需要的规则
  var formRule = {
    title: [
      { name: 'required', msg: '标题为必填项' }
    ],
    age: [
      { name: 'required', msg: '年龄为必填项' }
    ]
  }
  // 执行校验
  formValidator.validator(formModel, formRule, function (valid, errors) {
    if (valid) {
      console.log('校验通过')
    } else {
      console.log('校验失败：', errors)
    }
  })
```
  
- 异步校验

```
var formValidator = new FormValidator([
        {
          name: 'async-rule',
          msg: '自定义规则信息, 必填字段不能为空',
          asyncValidator: function (value, prop, rule, complete, error) {
            setTimeout(function () {
              var isValid = value != null && value !== ''
              complete(isValid)
            }, 1500)
            // 如果异步校验出错，强烈建议调用 error 回调，释放闭包内存
            // error('错误信息')
          }
        }
      ])
      var formModel = {
        title: ''
      }
      var formRule = {
        title: [
          { name: 'async-rule' }
        ]
      }
      formValidator.validator(formModel, formRule, function (valid, errors) {
        if (valid) {
          console.log('校验通过')
        } else {
          console.log('校验失败：', errors)
        }
      }, function (error) { // 异步校验出错，error回调函数
        console.log(error)
      })
```
- 自定义规则

```
var formValidator = new FormValidator()
    var formModel = {
      age: 17
    }
    var formRule = {
      age: [
        {
          msg: '年龄必须大于18岁，在调用规则的时候自定义',
          validator: function (value, prop, rule) {
            return value >= 18
          }
        }
      ]
    }

    formValidator.validator(formModel, formRule, function (valid, errors) {
      if (valid) {
        console.log('校验通过')
      } else {
        console.log('校验失败：', errors)
      }
    }, function (error) { // 异步校验出错，error回调函数
      console.log(error)
    })
```
- 扩展
1. 构造函数创建时候扩展
```
var formValidator = new FormValidator([
      {
        name: 'extend-rule',
        msg: '自定义规则信息, 必填字段不能为空',
        asyncValidator: function (value, prop, rule, complete, error) {
          setTimeout(function () {
            var isValid = value != null && value !== ''
            complete(isValid)
          }, 1500)
          // 如果异步校验出错，强烈建议调用 error 回调，释放闭包内存
          // error('错误信息')
        }
      }
    ])

```
2.使用实例化对象 extend 方法扩展
```
var formValidator = new FormValidator()
formValidator.extend([
    {
     name: 'extend-rule',
     msg: '自定义规则信息, 必填字段不能为空',
     asyncValidator: function (value, prop, rule, complete, error) {
       setTimeout(function () {
         var isValid = value != null && value !== ''
         complete(isValid)
       }, 1500)
       // 如果异步校验出错，强烈建议调用 error 回调，释放闭包内存
       // error('错误信息')
     }
    }
])
```
# License
[MIT](http://opensource.org/licenses/MIT)
