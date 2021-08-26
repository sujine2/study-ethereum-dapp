var express = require('express');
var router = express.Router();
const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/getbalance',function(req,res,nex){
  web3.eth.getBalance(req.body.addr,function(err, result){
    console.log(result);
    result = web3.utils.fromWei(result,"ether");
    res.send({balance:result});
  })
});

router.post('/sendether', async function(req,res,next){
  let keystore = req.body.keystore;
  let keypassword = req.body.keypassword;      
  let toaddress = req.body.toaddress;
  let ethervalue = req.body.ethervalue;

  console.log(keypassword);
  let pk;
  try{
    pk = web3.eth.accounts.wallet.decrypt([keystore],keypassword);

  }catch(err){
    console.log(err);
  }

  let fromAddress = pk[0]['address'];
  web3.eth.defaultAccount = fromAddress;

  let nonce = await web3.eth.getTransactionCount(fromAddress); //await 를 사용하려면 감싼 함수에 async 적어야함
  //트랜잭션을 차례로 처리하기 위함
  let gasPrice = await web3.eth.getGasPrice();
  let value = web3.utils.toWei(ethervalue, "ether");
  let gasLimit = await web3.eth.estimateGas({to:toaddress, from:fromAddress, value:value});

  let txObj ={
    nonce : nonce,
    gasPrice : gasPrice,
    gasLimit : gasLimit,
    to : toaddress,
    from : fromAddress,
    value : value
  }

  web3.eth.sendTransaction(txObj).on('transactionHash',function(hash){
    console.log(hash);
    
  }).on('confirmation',function(confirmNum,receipt) {
    if(confirmNum < 3) {
      console.log(confirmNum);
    }

    if(confirmNum == 3){
      console.log('Block')
    }

    res.send({trxhash:hash});
  })                
});

router.post('/gettrxinfo',async function(req, res, next){
  let trxhashs = req.body.trxhashs; //localStorage 에는 문자열로 저장돼서 반복문을 돌리려면 파싱할 수 있는 상태여야함
  //console.log(trxhashs)
  let result = [];

  trxhashs = JSON.parse(trxhashs);

  for(let i = 0; i < trxhashs.length; i++){
    //console.log(trxhashs[i]);
    let temp = await web3.eth.getTransaction(trxhashs[i]);  //동기방식이라 await 후 함수 async
    console.log(temp);
    temp.value = web3.utils.fromWei(temp.value,'ether');
    result.push(temp);
  }
  res.send(result);
});

module.exports = router;
