App = {
  web3Provider: null,
  contracts: {},

  init: async function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

    return await App.initWeb3();
  },

  initWeb3: async function() {
    // 确认是否是dapp的浏览器
    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        // 授权账号
        await window.ethereum.enable();
      } catch (error) {
        console.error("User denied account access")
      }
    }
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
      }
      // 没web3 instance
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
    }
    web3 = new Web3(App.web3Provider);


    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Adoption.json', function(data) {
      // 获得合约地址，aritifact信息包含合约的部署地址和ABI(is a JavaScript object defining how to interact with the contract including its variables, functions and their parameters.)
      var AdoptionArtifact = data;
      App.contracts.Adoption = TruffleContract(AdoptionArtifact);

      //设置我们自己的 provider的合约
      App.contracts.Adoption.setProvider(App.web3Provider);

      //调用合约
      return App.markAdopted();
    });


    return App.bindEvents();
  },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
  },

  markAdopted: function() {
    var adoptionInstance;
    // 部署合约
    App.contracts.Adoption.deployed().then(function(instance) {
      adoptionInstance = instance;
      // call()，只从链上读取数据，不发送完整的交易，也就是说，不用付钱(gas)[Doge]
      return adoptionInstance.getAdopters.call();
    }).then(function(adopters) {
      for (i = 0; i < adopters.length; i++) {
        if (adopters[i] !== '0x0000000000000000000000000000000000000000') {
          $('.panel-pet').eq(i).find('button').text('Success').attr('disabled', true);
        }
      }
    }).catch(function(err) {
      console.log(err.message);
    });

  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    var adoptionInstance;
    // 获取用户账户
    web3.eth.getAccounts(function(error, accounts) {
      if (error) {
        console.log(error);
      }
      // 第一个账户
      var account = accounts[0];
      // 可以获得获取已经部署过的合约
      App.contracts.Adoption.deployed().then(function(instance) {
        adoptionInstance = instance;

        // 通过发送账户执行adopt，以执行一个交易
        return adoptionInstance.adopt(petId, {from: account});
      }).then(function(result) {
        return App.markAdopted();
      }).catch(function(err) {
        console.log(err.message);
      });
    });

  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});
