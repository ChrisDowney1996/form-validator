void function (global, factory) {
  if (typeof exports === 'object' && typeof module !== 'undefined') {
    module.exports = factory()
  } else if (typeof define === 'function' && define.amd) {
    define(factory)
  } else {
    global.FormValidator = factory()
  }
}(this, function () {
  var _util = new Utils()
  var defaultRules = [
    {
      name: 'required',
      msg: '必填项',
      validator: function (value, prop, rule) {
        return value != null && value !== ''
      }
    },
    {
      name: 'tel',
      msg: '请输入正确的手机号',
      validator: function (value, prop, rule) {
        return /^[1](([3][0-9])|([4][5-9])|([5][0-3,5-9])|([6][5,6])|([7][0-8])|([8][0-9])|([9][1,8,9]))[0-9]{8}$/.test(value)
      }
    }
  ]

  var FormValidator = function (rule) {
    this.rules = _extend(defaultRules, rule)
    this.validator = _validator
    this.extend = function (rule) {
      this.rules = _extend.apply(this, this.rules, rule)
    }
  }

  function _extend (rules, rule) {
    var merge = function (r) {
      var hasMatch = false
      if (!_util.isObject(r)) { return }
      for (var i = 0; i < rules.length; i++) {
        if (rules[i].name === r.name) {
          hasMatch = true
          rules[i] = _util.extend(rules[i], r)
        }
      }
      if (hasMatch === false) {
        rules.push(r)
      }
    }
    if (_util.checkType(rule, 'Array')) {
      for (var i = 0; i < rule.length; i++) {
        merge(rule[i])
      }
    } else if (_util.checkType(rule, 'Object')) {
      merge(rule)
    }
    return rules
  }

  /**
   * @param model {Object} 校验的表单模型
   * @param matchRules {Object} 需要校验的表单字段规则 {title: [{...defaultRules}]}
   * @param callback {Function} 校验完成回调参数见下(参数1, 参数2)
   * @param callback.回调参数1 {Boolean} 校验是否通过
   * @param callback.回调参数2 {Object} 校验错误返回的字段
   * @param errorCallback {Function} 异步校验错误回调
   * @private
   */
  function _validator (model, matchRules, callback, errorCallback) {
    var rules = this.rules
    var modelKeys = _util.objectKeys(model)
    if (
      modelKeys.length === 0 ||
      _util.objectKeys(matchRules).length === 0
    ) {
      return callback(true, null)
    }
    // 1.过滤需要进行校验的字段(model 和 matchRules 进行匹配)
    var matchKeys = _filterMatchField(model, matchRules)
    if (matchKeys.length === 0) { return callback(true, null) }
    // 2.合并所有需要进行校验的规则数据
    var validatorData = _mergeValidatorData(matchKeys, rules, model, matchRules)
    if (_util.objectKeys(validatorData).length === 0){ return callback(true, null) }
    // 3.将合并之后的进行校验
    runValidator(validatorData, function (result) {
      callback(_util.objectKeys(result).length === 0, result)
    }, function () {
      errorCallback.apply(this, arguments)
    })
  }

  /**
   * @param validatorData
   * @param callback
   */
  function runValidator (validatorData, callback, errorCallback) {
    var asyncValidatorLength = getAsyncValidatorLength(validatorData)
    var result = {}
    var asyncError = false
    // 同步校验
    for (var key in validatorData) {
      var errors = []
      for (var i = 0; i < validatorData[key].validator.length; i++) {
        var item = validatorData[key].validator[i]
        var value = validatorData[key].value
        var validatorResult = item.validator(value, key, item)
        if (validatorResult === false) {
          errors.push(_util.extend(item, { value: value }))
        } else if (validatorResult && validatorResult.valid === false) {
          errors.push(_util.extend(item, { value: value }, validatorResult))
        }
      }
      if (errors.length > 0) {
        result[key] = errors
      }
    }
    if (asyncValidatorLength === 0) {
      return callback(result)
    }
    // 异步校验
    for (var key in validatorData) {
      for (var i = 0; i < validatorData[key].asyncValidator.length; i++) {
        void function (i, key) {
          var item = validatorData[key].asyncValidator[i]
          var value = validatorData[key].value
          item.asyncValidator(value, key, item, function (validatorResult) {
            if (asyncError === false) {
              var error
              var hasError = false
              if (validatorResult === false) {
                error = _util.extend(item, { value: value })
                hasError = true
              } else if (validatorResult && validatorResult.valid === false) {
                error = _util.extend(item, { value: value }, validatorResult)
                hasError = true
              }
              if (hasError) {
                if (_util.checkType(result[key], 'Array')) {
                  result[key].push(error)
                } else {
                  result[key] = [error]
                }
              }
              if (--asyncValidatorLength <= 0) {
                callback(result)
              }
            }
          }, function (error) { // 异步错误，释放i 和 key
            asyncError = true
            i = null
            key = null
            result = null
            errorCallback(new Error(error))
          })
        }(i, key)
      }
    }
  }

  function getAsyncValidatorLength (validatorData) {
    var result = 0
    if (!_util.isObject(validatorData)) {
      return result
    }
    for (var key in validatorData) {
      var item = validatorData[key]
      if (item.asyncValidator && item.asyncValidator.length > 0) {
        result += item.asyncValidator.length
      }
    }
    return result
  }

  /**
   * @param matchKeys {Array} _filterMatchField 参考方法的返回值
   * @param rules {Array} 默认规则
   * @param model {Object} 参考 _validator
   * @param matchRules {Object} 参考 _validator
   * @return {{}} {rule: {validator: [], asyncValidator: []}}
   * @private
   */
  function _mergeValidatorData (matchKeys, rules, model, matchRules) {
    var result = {};
    for (var i = 0; i < matchKeys.length; i++) {
      var matchKey = matchKeys[i] // 当前key
      var value = model[matchKey] // 当前model的值
      var keyRules = matchRules[matchKey] // 当前key需要匹配的规则
      var validatorInfo = {
        value: value,
        validator: [],
        asyncValidator: []
      };
      for (var j = 0; j < keyRules.length; j++) {
        var keyRule = keyRules[j]
        var hasMatch = false
        if (keyRule) { // IE 数组最后一个元素加','会导致数组新增一个Undefined
          for (var w = 0; w < rules.length; w++) { // 匹配默认规则
            var rule = rules[w]
            var isValidFn = false
            if (rule) {
              if (keyRule.name === rule.name) {
                if (typeof keyRule.validator === 'function') {
                  isValidFn = true
                  hasMatch = true
                  validatorInfo.validator.push(_util.extend(rule, keyRule))
                } else if (typeof keyRule.asyncValidator === 'function') {
                  isValidFn = true
                  hasMatch = true
                  validatorInfo.asyncValidator.push(_util.extend(rule, keyRule))
                } else if (typeof rule.asyncValidator === 'function') {
                  isValidFn = true
                  hasMatch = true
                  validatorInfo.asyncValidator.push(_util.extend(keyRule, rule))
                } else if (typeof rule.validator === 'function')  {
                  isValidFn = true
                  hasMatch = true
                  validatorInfo.validator.push(_util.extend(keyRule, rule))
                }
                if (isValidFn === false) {
                  console.warn('rule: {' + keyRule.name + '} 缺少validator函数或asyncValidator')
                }
              }
            }
          }
          if (hasMatch === false) {
            var isValidFn = false
            if (typeof keyRule.validator === 'function') {
              isValidFn = true
              validatorInfo.validator.push(keyRule)
            } else if (typeof keyRule.asyncValidator === 'function') {
              isValidFn = true
              validatorInfo.asyncValidator.push(_util.extend(keyRule))
            }
            if (isValidFn === false) {
              console.warn('rule: {' + keyRule.name + '} 缺少validator函数或asyncValidator')
            }
          }
        }
      }
      if (validatorInfo.validator.length > 0 || validatorInfo.asyncValidator.length > 0) {
        result[matchKey] = validatorInfo
      }
    }
    return result
  }

  /**
   * @param model {Object} 校验的表单模型
   * @param matchRules {Object} 需要校验的表单字段规则 {title: [{...defaultRules}]}
   * @return {[]|string} 需要校验的字段
   * @private
   */
  function _filterMatchField (model, matchRules) {
    var result = []
    var modelKeys = _util.objectKeys(model)
    for (var i = 0; i < modelKeys.length; i++) {
      var modelKey = modelKeys[i]
      var matchRule = matchRules[modelKey]
      if (matchRule != null) {
        result.push(modelKey)
      }
    }
    return result
  }

  function Utils () {
    this.extend = function () {
      var _this = this
      var args = [].slice.call(arguments)
      var merge = function (obj1, obj2) {
        if (!_this.isObject(obj1) || !_this.isObject(obj2)) {
          console.warn('合并对象数据类型是Object')
          return obj1
        }
        for (var key in obj2) {
          obj1[key] = obj2[key]
        }
        return obj1
      }
      if (args.length == 0) {
        return {}
      } else if (args.length === 1) {
        return args[0]
      } else {
        for (var i = 1; i < args.length; i++) {
          merge(args[0], args[i])
        }
        return args[0]
      }
    }
    this.objectKeys = function (obj) {
      var keys = []
      if (!this.isObject(obj)) {
        return keys
      }
      if (typeof Object.keys === 'function') {
        keys = Object.keys(obj)
      } else {
        for (var key in obj) {
          keys.push(key)
        }
      }
      return keys
    }
    this.checkType = function (value, type) {
      return Object.prototype.toString.call(value) === '[object ' + type + ']'
    }
    this.isObject = function (value) {
      return Object.prototype.toString.call(value) === '[object Object]'
    }
  }

  return FormValidator
})
