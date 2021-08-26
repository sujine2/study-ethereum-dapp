var express = require('express');
var router = express.Router();
const Web3 = require('web3');
const web3 = new Web3('http://localhost:8545');
///--여기가 컨트랙트랑 연결시키는 거임!
const TokenABI = require('./tokenabi');
let contractAddr = '0xD7a90FB56EFea161D1539d118Dd3869d08e3580B';
let contract = new web3.eth.Contract(TokenABI, contractAddr);



router.get('/token', function(req, res, next) {
    res.render('token');
});
  
router.post('/gettokenbalance', function(req,res,next){
    console.log(req.body.addr)
    contract.methods.balanceOf(req.body.addr).call().then(balance => {
      let value = web3.utils.fromWei(balance, 'ether');
      res.send({balance:value});
    })
});
    
router.post('/gettokenhistory', function(req,res,next){

    contract.getPastEvents('Transfer', {
        fromBlock: 0,
        toBlock: 'latest',
    }).then(function(events){
        for(let i=0;i<events.length;i++){
            events[i].returnValues.value = web3.utils.fromWei(events[i].returnValues.value, 'ether');
        }
        res.send(events);
    })
});

router.post('/sendtoken', async function(req,res,next){
    let keystore = req.body.keystore;
    let keypassword = req.body.keypassword;      
    let toaddress = req.body.toaddress;
    let tokenvalue = req.body.tokenvalue;
  
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
    let value = web3.utils.toWei(tokenvalue, "ether");
//------------토큰 전송금액
    let encodeABI = contract.methods.transfer(toaddress, value).encodeABI();//
    let gasLimit = await contract.methods.transfer(toaddress,value).estimateGas({from: fromAddress});
    let txObj ={
      nonce : nonce,
      gasPrice : gasPrice,
      gasLimit : gasLimit,
      to : contractAddr, //중요, 컨트랙트한테 명령전달, 컨트랙트 컨트롤! 명령안에 누구에게 토큰 얼마를 보내라라는 명령이있음
      from : fromAddress,
      value : 0,  //ether 에 해당하는 주소임, 금액전송이아니라 명령전달
      //메인넷에서는 실제 전송되면
      data: encodeABI //to주소한테 보낼 역할 / 어떤 주소와 어떤 금액으로 전달할지 담음
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

module.exports = router;