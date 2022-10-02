import "./App.css";
import { useState, useEffect } from "react";
import Web3 from "web3";
import { purchaseEvent } from "./lib/fpixel";
import JadeMine from "./contract/JadeMine.json";
import Logo from "./media/Logo.png";
import React from "react";
import TelegramSocial from "./media/Telegram_Social.svg";
import DiscordSocial from "./media/Discord_Social.svg";
import BscSan from "./media/BscScan.svg";

function App(props) {
	const [isWalletConnected, setIsWalletConnected] = useState(false);
	const [address, setAddress] = useState("");

	const [walletBalance, setWalletBalance] = useState("0");
	const [contractBalance, setContractBalance] = useState("0");
	const [jadeBalance, setJadeBalance] = useState("0");
	const [rewardsBalance, setRewardsBalance] = useState("0");

	const [isConnectBtn, setIsConnectBtn] = useState(false);
	const [isMineBtn, setIsMineBtn] = useState(true);
	const [isRewardsBtn, setIsRewardsBtn] = useState(false);

	const [depositAmount, setDepositAmount] = useState(0);

	const [referrerAddress, setReferrerAddress] = useState(
		"0x0000000000000000000000000000000000000000"
	);

	const [snackMsg, setSnackMsg] = useState("");
	const [isSnack, setIsSnack] = useState(false);

	const [jadeMineContract, setJadeMineContract] = useState(null);

	const refLink = window.location.origin.concat("?ref=", address);
	const mainNetId = 97;
	const contractAddress = "0x457f4721D0Fbb60490C6e73a6c992C963612BA26";

	const web3 = window.web3;

	useEffect(() => {
		if (localStorage.getItem("prevCon") === "true") {
			handleWalletConnection();
		}
	}, []);

	useEffect(() => {
		if (window.location.search) {
			if (window.location.search.substring(5) !== address) {
				setReferrerAddress(window.location.search.substring(5));
			} else {
				setReferrerAddress("0x0000000000000000000000000000000000000000");
			}
		}
	}, [address]);

	useEffect(() => {
		if (isWalletConnected) {
			setIsMineBtn(false);
		} else {
			setIsMineBtn(true);
		}
	}, [isWalletConnected, depositAmount]);

	useEffect(() => {
		if (isWalletConnected === true) {
			setIsRewardsBtn(false);
		} else {
			setIsRewardsBtn(true);
		}
	}, [isWalletConnected]);

	if (typeof window.ethereum !== "undefined") {
		window.ethereum.on("accountsChanged", (accounts) => {
			setAddress(accounts[0]);
			loadAppData(accounts[0]);
			callSnackBar("Account Changed", true);
		});

		window.ethereum.on("chainChanged", (chainId) => {
			window.location.reload();
			callSnackBar("Chain Changed", true);
		});
	}

	const callSnackBar = (snackMessage, withTime) => {
		if (withTime) {
			setSnackMsg(snackMessage);
			setIsSnack(true);
			setTimeout(() => {
				setIsSnack(false);
				setSnackMsg("");
			}, 3000);
		} else if (withTime === false) {
			setSnackMsg(snackMessage);
			setIsSnack(true);
		}
	};

	const handleWalletConnection = async () => {
		if (typeof window.ethereum !== "undefined") {
			if (!isWalletConnected) {
				window.web3 = new Web3(window.ethereum);

				setIsConnectBtn(true);

				const web3 = window.web3;

				window.ethereum
					.request({ method: "eth_requestAccounts" })
					.then((res) => {
						setAddress(res[0]);
						setIsWalletConnected(true);
						setIsConnectBtn(false);
						callSnackBar("Wallet Connected", true);

						if (localStorage.getItem("prevCon") === "true") {
						} else {
							localStorage.setItem("prevCon", "true");
						}

						loadAppData(res[0]);
					});
			} else {
				setIsWalletConnected(false);
				callSnackBar("Wallet Disconnected", true);

				setAddress("");

				setWalletBalance("0");
				setContractBalance("0");
				setJadeBalance("0");
				setRewardsBalance("0");
			}
		} else {
			callSnackBar("Metamask not Installed", false);
		}
	};

	const loadAppData = async (dataAddress) => {
		const web3 = window.web3;

		web3.eth.getBalance(dataAddress).then((response) => {
			const bal = parseFloat(web3.utils.fromWei(response))
				.toString()
				.match(/^-?\d+(?:\.\d{0,2})?/)[0];
			setWalletBalance(bal);
		});

		const networkId = await web3.eth.net.getId();
		if (networkId === mainNetId) {
			const jadeMine = await new web3.eth.Contract(
				JadeMine.abi,
				contractAddress
			);
			setJadeMineContract(jadeMine);

			const getContractBal = await jadeMine.methods.getBalance().call();
			setContractBalance(
				parseFloat(web3.utils.fromWei(getContractBal))
					.toString()
					.match(/^-?\d+(?:\.\d{0,2})?/)[0]
			);

			const getJadeBal = await jadeMine.methods.getMyMiners(dataAddress).call();
			setJadeBalance(
				parseFloat(getJadeBal)
					.toString()
					.match(/^-?\d+(?:\.\d{0,2})?/)[0]
			);

			const getRewardsBal = await jadeMine.methods
				.jadeRewards(dataAddress)
				.call();
			setRewardsBalance(
				parseFloat(web3.utils.fromWei(getRewardsBal))
					.toString()
					.match(/^-?\d+(?:\.\d{0,4})?/)[0]
			);
		} else {
			await window.ethereum.request({
				method: "wallet_switchEthereumChain",
				params: [{ chainId: "4" }],
			});
		}
	};

	const handleRemineClick = () => {
		setIsRewardsBtn(true);
		setIsConnectBtn(true);
		setIsMineBtn(true);

		callSnackBar("Processing...", false);

		jadeMineContract.methods
			.harvestJades(referrerAddress)
			.send({ from: address })
			.once("receipt", (receipt) => {
				loadAppData(address);

				callSnackBar("Transaction Complete", true);
			})
			.catch((err) => {
				callSnackBar("Transaction Failed", true);
			})
			.finally(() => {
				setIsRewardsBtn(false);
				setIsConnectBtn(false);
			});
	};

	const handleCollectClick = () => {
		setIsConnectBtn(true);
		setIsRewardsBtn(true);
		setIsMineBtn(true);

		callSnackBar("Processing...", false);

		jadeMineContract.methods
			.sellJades()
			.send({ from: address })
			.once("receipt", (receipt) => {
				loadAppData(address);

				callSnackBar("Transaction Complete", true);
			})
			.catch((err) => {
				callSnackBar("Transaction Failed", true);
			})
			.finally(() => {
				setIsRewardsBtn(false);
				setIsConnectBtn(false);
			});
	};

	const handleMineJadeClick = () => {
		setIsConnectBtn(true);
		setIsRewardsBtn(true);
		setIsMineBtn(true);

		callSnackBar("Processing...", false);

		jadeMineContract.methods
			.buyJades(referrerAddress)
			.send({ from: address, value: depositAmount })
			.once("receipt", (receipt) => {
				loadAppData(address);

				purchaseEvent("Purchase", {
					currency: "USD",
					value: web3.utils.fromWei(depositAmount).toString(),
				});

				callSnackBar("Transaction Complete", true);
			})
			.catch((err) => {
				callSnackBar("Transaction Failed", true);
			})
			.finally(() => {
				setIsRewardsBtn(false);
				setIsConnectBtn(false);
			});
	};

	return (
		<div className="app">
			{isSnack && <SnackBar message={snackMsg} />}

			<div className="app__nav">
				<img className="app__logo" src={Logo} alt="Ruby Mine Logo" />
			</div>

			<div className="app__topinfobar"></div>

			<div className="app__main">
				<button
					disabled={isConnectBtn}
					onClick={handleWalletConnection}
					className={
						isConnectBtn ? "app__walletconnectdisabled" : "app__walletconnect"
					}
				>
					{isWalletConnected ? "DISCONNECT" : "CONNECT"}
				</button>

				<h6 className="app__heading">
					Mine <span>Jade</span>. Earn <span>BNB</span>. Repeat
				</h6>

				<div className="app__interact">
					<div className="app__interactmargin">
						<div className="app__interactstats">
							<div className="app__interactstatsdata">
								<p>Contract</p>
								<h5>{contractBalance} BNB</h5>
							</div>

							<div className="app__interactstatsdata">
								<p>Wallet</p>
								<h5>{walletBalance} BNB</h5>
							</div>

							<div className="app__interactstatsdata">
								<p>Jade</p>
								<h5>{jadeBalance} JADE</h5>
							</div>
						</div>

						<div className="app__inputcontainer">
							<input
								onChange={(e) =>
									setDepositAmount(web3.utils.toWei(e.target.value))
								}
								placeholder="0.1"
								className="app__inputavax"
								type="number"
							/>
							<div className="app__inputavaxsymbol">
								<p>BNB</p>
							</div>
						</div>

						<button
							onClick={handleMineJadeClick}
							disabled={isMineBtn}
							className={isMineBtn ? "app__minebtndisabled" : "app__minebtn"}
						>
							HIRE MINERS
						</button>

						<div className="app__divider"></div>

						<div className="app__interactstatsreward">
							<p>Your Rewards</p>
							<h5>{rewardsBalance} BNB</h5>
						</div>

						<div className="app__rewards">
							<button
								onClick={handleRemineClick}
								disabled={isRewardsBtn}
								className={
									isRewardsBtn ? "app__rewardsbtndisabled" : "app__rewardsbtn"
								}
							>
								RE-HIRE
							</button>
							<button
								onClick={handleCollectClick}
								disabled={isRewardsBtn}
								className={
									isRewardsBtn ? "app__rewardsbtndisabled" : "app__rewardsbtn"
								}
							>
								COLLECT
							</button>
						</div>
					</div>
				</div>

				<div className="app__statistics">
					<div className="app__statisticsmargin">
						<h5 className="app__statisticshead">Statistics</h5>

						<div className="app__statisticsdivider"></div>

						<div className="app__statisticsinfo">
							<p>Daily Return</p>
							<p>Up to 8%</p>
						</div>

						<div className="app__statisticsinfo">
							<p>APR</p>
							<p>2,920%</p>
						</div>

						<div className="app__statisticsinfo">
							<p>Deposit Fee</p>
							<p>8%</p>
						</div>
					</div>
				</div>

				<div className="app__referral">
					<h5>Referral Link</h5>

					<input
						className="app__referralinput"
						type="text"
						readOnly
						value={refLink}
					/>

					<p>
						Earn 12% of the BNB used to mine jade
						<br /> from anyone who uses your referral link
					</p>
				</div>

				<div className="app__socials">
					<a
						href="https://snowtrace.io/address/0x31A226acD218fe1FD2E6b26767E670e868b6E65f"
						target="_blank"
						rel="noreferrer"
						className="app__socialslinks"
					>
						<img src={BscSan} alt="SnowTrace Social" />
					</a>
					<a
						href="https://t.me/meta_miners"
						target="_blank"
						rel="noreferrer"
						className="app__socialslinks"
					>
						<img src={TelegramSocial} alt="Telegram Social" />
					</a>
					<a
						href="https://twitter.com/metaminersdefi"
						target="_blank"
						rel="noreferrer"
						className="app__socialslinks"
					>
						<img alt="Twitter Social" />
					</a>
					<a
						href="https://discord.gg/eDxyZQP84H"
						target="_blank"
						rel="noreferrer"
						className="app__socialslinks"
					>
						<img src={DiscordSocial} alt="Discord Social" />
					</a>
					<a
						href="https://hazecrypto.net/audit/rubymine"
						target="_blank"
						rel="noreferrer"
						className="app__socialslinkshaze"
					>
						<img alt="HazeCrypto Social" />
					</a>
				</div>

				<a className="app__business" href="mailto:marketing@rubymine.money">
					Business Inquiries
				</a>
			</div>
		</div>
	);

	function SnackBar(props) {
		return (
			<div className="app__snackbar">
				<span>{props.message}</span>
			</div>
		);
	}
}

export default App;
