angular.module('ethExplorer')
	.controller('addressInfoCtrl', function ($rootScope, $scope, $location, $routeParams, $q) {

		var web3 = $rootScope.web3;

		////////////////////////////////////////////////////////////////////////////////
		
		$scope.mint = function () {
			var namej = prompt("请输入JNS名字（不带后缀.j）：", "");
			if (namej) { // TODO more validation?
				if (window.ethereum && window.ethereum.isConnected()) {
					// hacking...
					web3.setProvider(window.ethereum);
					web3.eth.defaultAccount = web3.eth.accounts[0];

					if (web3.eth.defaultAccount == this.jnsContractOwner) {
						var jns_contract = web3.eth.contract(jns_ABI).at(jns_contract_address);
						jns_contract.claim(namej,
							function (err, result) {
								if (err) {
									console.log(err);
									//alert('出错啦：' + err.message);
								}
							}); // no need to send(), amazing!

					}
				}

			}
			
		}

		////////////////////////////////////////////////////////////////////////////////

		$scope.init = function(){

			$scope.addressId = $routeParams.addressId;

			if($scope.addressId !== undefined) {

				getAddressInfos().then(function(result){
					$scope.balance = result.balance;
					$scope.balanceInEther = result.balanceInEther;
				});

				getAllJTI().then(function(result) {
					$scope.countJTI = result.length.toString(); // .toString() !!
					$scope.allJTI = result;
				});

				getAllFlyingJ().then(function(result) {
					$scope.countFlyingJ = result.length.toString(); // .toString() is important to work with ||
					$scope.allFlyingJ = result;
				});

				getAddressNS();
				getAllJNS();
				getAllJNSVote();
			}

			function getAddressInfos(){
				var deferred = $q.defer();

				web3.eth.getBalance($scope.addressId,function(error, result) {
					if(!error) {
						// intentionally delay...
						window.setTimeout(function() {
							deferred.resolve({
								balance: result.toString(),
								balanceInEther: web3.fromWei(result, 'ether').toString()
							});
						}, 0 /*Math.floor(Math.random() * 3000) + 2000*/);
					} else {
						deferred.reject(error);
					}
				});
				return deferred.promise;
			}

			function getAddressNS() {
				var addr = $scope.addressId;
				var jns_contract = web3.eth.contract(jns_ABI).at(jns_contract_address);
				jns_contract._whois.call(addr, function (err, result) {
					if (!err) {
						var jns_id = result.toString();
						if (jns_id > 0) {
							jns_contract.tokenURI.call(jns_id, function (err2, result2) {
								var jns_tokenURI = result2;
								$scope.jns_info = parseTokenURI(jns_tokenURI);
								$scope.$apply(); //update
							});
						}
					}
				});
			}

			function parseTokenURI(tokenURI) {
				var [t, s] = tokenURI.split(',');
				if (t == 'data:application/json;base64') {
					var metadata = JSON.parse(atob(s));
					/*var [t2, s2] = metadata.image.split(',');
				if (t2 == 'data:image/svg+xml;base64') {
					var svg = atob(s2);
					metadata.image = svg;
				}*/
					return metadata;
				}
				return null;
			}

			async function _getAllJTI() {
				//var deferred = $q.defer();

				var list = [];

				var addr = $scope.addressId;

				////////////////////////////////////////////////////////////////////////////////

				var contract = web3.eth.contract(jti_ABI).at(jti_contract_address);
				var balance = await contract.balanceOf.call(addr).toString();

				if (balance > 0) {
					//var token_name = await contract.name.call();
					var token_name = "J Trusted Identity";
					var token_id = await contract.tokenOfOwnerByIndex.call(addr).toString();
					var tag = token_name + ' #' + token_id;
					var tokenURI = await contract.tokenURI.call(token_id);

					var tokenInfo = parseTokenURI(tokenURI);

					list.push({'tag': tag, 'tokenInfo': tokenInfo});
				}

				return list;
			}

			function getAllJTI() {
				var deferred = $q.defer();

				// intentionally delay...
				window.setTimeout(function() {
					var list = _getAllJTI();
					deferred.resolve(list);
				}, 0 /*Math.floor(Math.random() * 3000) + 2000*/);

				return deferred.promise;
			}

			async function _getAllFlyingJ() {
				//var deferred = $q.defer();

				var list = [];

				var addr = $scope.addressId;

				////////////////////////////////////////////////////////////////////////////////
				//console.log(flyingj_ABI);

				var contract = web3.eth.contract(flyingj_ABI).at(flyingj_contract_address);
				var balance = await contract.balanceOf.call(addr).toString();

				//console.log(balance);

				if (balance > 0) {
					//var token_name = await contract.name.call();
					var token_name = "Flying J";
					var token_id = await contract.tokenOfOwnerByIndex.call(addr).toString();
					var tag = token_name + ' #' + token_id;
					var tokenURI = await contract.tokenURI.call(token_id);

					//console.log(tag);

					var tokenInfo = parseTokenURI(tokenURI);

					//console.log(tokenInfo);

					list.push({'tag': tag, 'tokenInfo': tokenInfo});
				}

				return list;
			}

			function getAllFlyingJ() {
				var deferred = $q.defer();

				// intentionally delay...
				window.setTimeout(function() {
					var list = _getAllFlyingJ();
					deferred.resolve(list);
				}, 0 /*Math.floor(Math.random() * 3000) + 2000*/);

				return deferred.promise;
			}

			function getAllJNS() {
				$scope.allJNS = [];
				var addr = $scope.addressId;
				var contract = web3.eth.contract(jns_ABI).at(jns_contract_address);
				contract.balanceOf.call(addr, function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJNS = balance;
						for (var i = 0; i < balance; i++) {
							var token_name = "J Name Service";
							contract.tokenOfOwnerByIndex.call(addr, i, function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.tokenURI.call(token_id, function (err3, result3) {
										if (err3) {
											console.log(err3);
										} else {
											var tokenURI = result3;
											var tokenInfo = parseTokenURI(tokenURI);
											$scope.allJNS.push({'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});

				// if showing mint button
				contract.owner.call(function (err, result) {
					$scope.chainId = window.ethereum ? window.ethereum.chainId : '';
					$scope.account = window.ethereum ? window.ethereum.selectedAddress : '';
					$scope.jnsContractOwner = result.toString();
					console.log('[addressInfo] chainId: ', $scope.chainId, 'account: ', $scope.account, 'jnsContractOwner: ', $scope.jnsContractOwner);
					$scope.$apply();
				});
			}

			function getAllJNSVote() {
				$scope.allJNSVote = [];
				var addr = $scope.addressId;
				var contract = web3.eth.contract(jnsvote_ABI).at(jnsvote_contract_address);
				contract.balanceOf.call(addr, function (err1, result1) {
					if (err1) {
						console.log(err1);
					} else {
						var balance = result1.toString();
						$scope.countJNSVote = balance;
						for (var i = 0; i < balance; i++) {
							var token_name = "JNS Vote";
							contract.tokenOfOwnerByIndex.call(addr, i, function (err2, result2) {
								if (err2) {
									console.log(err2);
								} else {
									var token_id = result2.toString();
									var tag = token_name + ' #' + token_id;
									contract.tokenURI.call(token_id, function (err3, result3) {
										if (err3) {
											console.log(err3);
										} else {
											var tokenURI = result3;
											var tokenInfo = parseTokenURI(tokenURI);
											$scope.allJNSVote.push({'tag': tag, 'tokenInfo': tokenInfo});
											$scope.$apply(); // inform the data updates !
										}
									});
								}
							});
						}
					}
				});

			}

			//////////////// add listeners /////////////////
			if (window.ethereum) {
				
				window.ethereum.on('chainChanged', function (chainId) {
					console.log("[addressInfo] switched to chain id: ", parseInt(chainId, 16));
					$scope.chainId = chainId;
					$scope.$apply();
				});

				window.ethereum.on('accountsChanged', function (accounts) {
					console.log("[addressInfo] switched to account: ", accounts[0]);
					$scope.account = accounts[0];
					$scope.$apply();
				});
			}

		};

		$scope.init();

	});
