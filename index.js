// AMAZON docs
// https://www.amazon.com/b/ref=s9_acss_bw_ln_gccorpna_1_2?_encoding=UTF8&node=11873430011&pf_rd_m=ATVPDKIKX0DER&pf_rd_s=merchandised-search-left-2&pf_rd_r=2JE8M82DFS2KFGFPN6DZ&pf_rd_t=101&pf_rd_p=2397953162&pf_rd_i=12726593011

'use strict'

const superagent = require('superagent')
  , _ = require('lodash')
  , aws4 = require('aws4')
  , https = require('https')



module.exports = (options) => {

  options = options || {}
  options = _.assign({
      api: 'agcod-v2-eu-gamma.amazon.com'
    , partnerId: ''
    , env: options.env || 'dev'
    , debug: false
    , xml: false
  }, options)

  if(options.env == 'production')
    options.api = 'agcod-v2-eu.amazon.com'

  if(!options.accessKeyId || !options.secretAccessKey)
    throw new Error('provide amazon accessKeyId && secretAccessKey')

  const mock = options.mock || {}

  const debug = (a, b = '') => {
    if(options.debug) console.log(a, b)
  }

  const error = (err, res) => {
    if(!err) return false

    if(res && res.body)
      return {
          errorCode: res.body.errorCode
        , errorType: res.body.errorType
        , message: res.body.message
      }
    
    else
      return err
  }

  const request = (method, endpoint, data, callback = ()=>{}) => {
    if(typeof data == 'function'){
      callback = data
      data = ''
    }

    data = data || {}

    const opts = {
        'method': (method || 'get').toUpperCase()
      , 'host': options.api
      , 'path': endpoint
      , 'body': JSON.stringify(data)  
      , 'region': 'eu-west-1'
      , 'service': 'AGCODService'
      , 'headers': { 
            'content-type': 'application/json'
          , 'accept': 'application/json' 
        }
    }

    // sign request & generate headers
    aws4.sign(opts, { 
        accessKeyId: options.accessKeyId
      , secretAccessKey: options.secretAccessKey
    })

    debug('  =>', [opts.method, endpoint, data].join(' '))
    
    // make the call
    superagent
      [opts.method.toLowerCase()]('https://'+opts.host+opts.path)
      .set(opts.headers)
      .send(opts.body)
      .end(function(err, res){
        const e = error(err, res)

        if(e) debug('  => err', e)
        if(e) return callback(e)
        
        debug('  =>', res.body)
        callback(null, res.body, res)
      })
  }


  const api = {


    // CreateGiftCard({
    //     amount: 125.5
    //   , currencyCode: 'EUR'
    // })
    // 
    // =>
    //
    // <CreateGiftCardResponse>
    //   <gcClaimCode>TZG3-C9SHMH-92DJ</gcClaimCode>
    //   <cardInfo>
    //     <value>
    //       <currencyCode>EUR</currencyCode>
    //       <amount>1.0</amount>
    //     </value>
    //     <cardStatus>Fulfilled</cardStatus>
    //   </cardInfo>
    //   <gcId>A2B45P50AG2R7J</gcId>
    //   <creationRequestId>Flooz1467045324488</creationRequestId>
    //   <gcExpirationDate>Sat Jun 27 21:59:59 UTC 2026</gcExpirationDate>
    //   <status>SUCCESS</status>
    // </CreateGiftCardResponse>

    CreateGiftCard: (data, callback = ()=>{}) => {
      data = data || {}
      debug('amazon.CreateGiftCard', data)

      const body = { 
          creationRequestId: options.partnerId+Date.now()
        , partnerId: options.partnerId
        , value: {
              currencyCode: data.currencyCode || 'EUR'
            , amount: data.amount || false
          }
      }

      request('post', '/CreateGiftCard', body, callback)
    },


    CancelGiftCard: (data, callback = ()=>{}) => {
      data = data || {}
      debug('amazon.CancelGiftCard', data)

      const body = { 
          creationRequestId: data.creationRequestId
        , partnerId: options.partnerId
        , gcId: data.gcId
      }

      request('post', '/CancelGiftCard', body, callback)
    },


    ActivateGiftCard: (data, callback = ()=>{}) => {
      data = data || {}
      debug('amazon.ActivateGiftCard', data)

      const body = { 
          activationRequestId: options.partnerId+Date.now()
        , partnerId: options.partnerId
        , cardNumber: data.cardNumber
        , value: {
              currencyCode: data.currencyCode || 'EUR'
            , amount: data.amount || false
          }
      }

      request('post', '/ActivateGiftCard', body, callback)
    },


    DesactivateGiftCard: (data, callback = ()=>{}) => {
      data = data || {}
      debug('amazon.DesactivateGiftCard', data)

      const body = { 
          activationRequestId: data.activationRequestId
        , partnerId: options.partnerId
        , cardNumber: data.cardNumber
      }

      request('post', '/DesactivateGiftCard', body, callback)
    },


    GetGiftCardActivityPage: (data, callback = ()=>{}) => {
      data = data || {}
      debug('amazon.GetGiftCardActivityPage', data)

      const body = { 
          requestId: options.partnerId+Date.now()
        , partnerId: options.partnerId
      }

      request('post', '/GetGiftCardActivityPage', body, callback)
    },


    ActivationStatusCheck: (data, callback = ()=>{}) => {
      data = data || {}
      debug('amazon.ActivationStatusCheck', data)

      const body = { 
          statusCheckRequestId: options.partnerId+Date.now()
        , partnerId: options.partnerId
        , cardNumber: data.cardNumber
      }

      request('post', '/ActivationStatusCheck', body, callback)
    }

  }

  return api

}


