import axios from 'axios';
import React, {useEffect, useRef, useState} from 'react';
import {useLocation, useNavigate, useParams} from 'react-router-dom';
import './booking.css';
import Button from '@material-ui/core/Button';
import BdOtherInfo from './BdOtherInfo';
import defaultImg from './img/404.png';
import IconButton from '@mui/material/IconButton';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import queryString from 'query-string';
import jwt_decode from 'jwt-decode';
import BdPayment from './BdPayment';
import BDTop from './BDTop';

function BookingDetail() {
	const [roomData, setRoomData] = useState('');
	const [optionList, setOptionList] = useState([]);
	const [name, setName] = useState('');
	const [phone, setPhone] = useState('');
	const [email, setEmail] = useState('');
	const [purpose, setPurpose] = useState('');
	const [hostNum, setHostNum] = useState('');
	const [price, setPrice] = useState(0);
	// 요청사항 (textarea)
	const contentRef = useRef('');

	// iamport
	const {IMP} = window;
	// 옵션 수량 버튼
	const [optionPrice, setOptionPrice] = useState('');

	// 상세페이지 값들
	const {search} = useLocation();
	const {num, date, head, stime, etime} = queryString.parse(search);

	const navi = useNavigate();

	//url
	const url = `http://localhost:9000/room/detail?num=${num}`;
	const cUrl = `http://localhost:9000/room/category?num=${num}`;
	const fUrl = `http://localhost:9000/room/facility?num=${num}`;
	const oUrl = `http://localhost:9000/room/option?num=${num}`;
	const imgUrl = 'http://localhost:9000/image/';

	let totalPrice = price + optionPrice;

	let userNum = jwt_decode(localStorage.getItem('token')).idx;
	// 시간 계산
	let time = new Array();
	for (let i = stime; i <= etime; i++) {
		time.push(i);
	}
	let bookingTime = time.join(',');
	let headCount = head;
	let bookingDate = date;
	let roomNum = num;

	const selectRoomData = () => {
		axios.get(url).then((res) => {
			setRoomData(res.data);
			setHostNum(res.data.hostNum);
		});
	};

	// 총 가격 계산
	const priceSum = () => {
		let price = 0;
		let bookingDate = new Date(date);

		for (let i = Number(stime); i <= Number(etime); i++) {
			//주말 오전 오후 가격
			if (bookingDate.getDay() === 0 || bookingDate.getDay() === 6) {
				if (i >= 6 && i <= 18) {
					price += roomData.holiAmPrice;
				} else {
					price += roomData.holiPmPrice;
				}
			} else {
				//평일 오전 오후 가격
				if (i >= 6 && i <= 18) {
					price += roomData.weekAmPrice;
				} else {
					price += roomData.weekPmPrice;
				}
			}
		}
		setPrice(price);
	};

	// 옵션 초기값
	const initialState = {
		count: 0,
		roomNum: num,
		roptionNum: 0,
		name: '',
		price: 0,
	};

	// 옵션 insert할 배열
	const [optionInsertList, setOptionInsertList] = useState([]);

	const selectOptionData = () => {
		axios.get(oUrl).then((res) => {
			setOptionList(res.data);

			let options = [];

			for (let i = 0; i < res.data.length; i++) {
				options[i] = {
					...initialState,
					roptionNum: res.data[i].ronum,
					name: res.data[i].oname,
					price: res.data[i].price,
				};
			}
			setOptionInsertList(options);
		});
	};

	const onErrorImg = (e) => {
		e.target.src = defaultImg;
	};

	const onSend = (bookingStatus) => {
		// 요청사항
		let request = contentRef.current.value;
		let insertUrl = 'http://localhost:9000/bookingDetail/insert';

		axios
			.post(insertUrl, {
				bookingDate,
				bookingTime,
				headCount,
				name,
				phone,
				email,
				purpose,
				request,
				totalPrice,
				bookingStatus,
				roomNum,
				userNum,
			})
			.then((res) => {
				setName('');
				setPhone('');
				setEmail('');
				setPurpose('');
				contentRef.current.value = '';
			});
	};

	const onOptionSend = () => {
		let insertUrl = 'http://localhost:9000/bookingDetailOption/insert';

		axios({
			url: insertUrl,
			method: 'post',
			data: {optionInsertList},
		}).then((res) => {});
	};

	// 옵션 수량 버튼
	const onIncrease = (idx) => {
		let options = [...optionInsertList];
		options[idx].count += 1;
		setOptionInsertList(options);
		totalOptionSum(options);
	};

	const onDecrease = (idx) => {
		let options = [...optionInsertList];

		if (options[idx].count > 0) {
			options[idx].count -= 1;
		} else {
			options[idx].count = 0;
		}

		setOptionInsertList(options);
		totalOptionSum(options);
	};

	// 옵션 가격 계산
	const totalOptionSum = (optionInsertList) => {
		let total = 0;
		Object.keys(optionInsertList).map((item) => {
			total +=
				optionInsertList[item].price * optionInsertList[item].count;
		});
		setOptionPrice(total);
	};
	console.log(jwt_decode(localStorage.getItem('token')).email);

	// 결제
	function payment(data) {
		IMP.init('imp30007238'); //아임포트 관리자 콘솔에 서 확인한 '가맹점 식별코드' 입력
		IMP.request_pay(
			{
				// param
				pg: 'kakaopay', //pg사명 or pg사명.CID (잘못 입력할 경우, 기본 PG사가 띄워짐)
				pay_method: 'card', //지불 방법
				merchant_uid: `mid_${new Date().getTime()}`, //가맹점 주문번호 (아임포트를 사용하는 가맹점에서 중복되지 않은 임의의 문자열을 입력)
				name: roomData.name, //결제창에 노출될 상품명
				amount: totalPrice, //금액
				buyer_email: jwt_decode(localStorage.getItem('token')).email,
				buyer_name: jwt_decode(localStorage.getItem('token')).nickname,
			},
			function (rsp) {
				// callback
				if (rsp.success) {
					alert(
						'완료 -> imp_uid : ' +
							rsp.imp_uid +
							' / merchant_uid(orderKey) : ' +
							rsp.merchant_uid,
					);
					onSend(5);
				} else {
					alert(
						'실패 : 코드(' +
							rsp.error_code +
							') / 메세지(' +
							rsp.error_msg +
							')',
					);
				}
			},
		);
	}

	useEffect(() => {
		selectRoomData();
		selectOptionData();
	}, []);

	useEffect(() => {
		if (phone.length === 10) {
			setPhone(phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3'));
		}
		if (phone.length === 13) {
			setPhone(
				phone
					.replace(/-/g, '')
					.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3'),
			);
		}
	}, [phone]);

	useEffect(() => {
		priceSum();
	}, [roomData, price]);

	return (
		<>
			<form>
				<div>
					<div className='bookingTop'>
						<h1>예약하기</h1>
					</div>
					<div className='bdContainer'>
						<div className='dbItem'>
							<BDTop
								price={price}
								roomData={roomData}
								date={date}
								head={head}
								num={num}
							/>

							<div className='bdOption'>
								{optionList.some(
									(elem) => elem.ronum !== '',
								) ? (
									<>
										<div
											style={{
												display: 'flex',
												borderBottom:
													'3px solid #704de4',
												marginTop: '30px',
											}}
										>
											<h4>추가옵션선택</h4>
											<IconButton
												color='primary'
												style={{
													color: '#704de4',
													marginLeft: 'auto',
												}}
												aria-label='add to shopping cart'
												onClick={() => {
													onOptionSend();
												}}
											>
												<AddShoppingCartIcon />
											</IconButton>
										</div>
									</>
								) : (
									<></>
								)}

								{optionList.map((item, idx) =>
									item.oname == null ? (
										<></>
									) : (
										<>
											<div
												className='bdSpaceInfo'
												key={idx}
											>
												<>
													<img
														alt=''
														src={item.oimageUrl}
														width='110'
														height={110}
														onError={onErrorImg}
													/>
													<div
														style={{
															marginLeft: '50px',
														}}
													>
														<h5>{item.oname}</h5>
														<p>
															{item.price} / 수량
															1개
														</p>
														<div>
															<Button
																variant='outlined'
																style={{
																	marginBottom:
																		'3px',
																	width: '10px',
																}}
																onClick={() => {
																	onDecrease(
																		idx,
																	);
																}}
															>
																-
															</Button>

															<input
																type='text'
																value={
																	optionInsertList[
																		idx
																	].count
																}
																style={{
																	width: '250px',
																	height: '36px',
																	textAlign:
																		'center',
																}}
															></input>

															<Button
																variant='outlined'
																style={{
																	marginBottom:
																		'3px',
																}}
																onClick={() =>
																	onIncrease(
																		idx,
																	)
																}
															>
																+
															</Button>
														</div>
													</div>
													<br />
													<br />
												</>
											</div>
										</>
									),
								)}
							</div>
							<div
								style={{
									display: 'flex',
									borderBottom: '3px solid #704de4',
									marginTop: '30px',
								}}
							>
								<h4>예약자정보</h4>
								<p
									style={{
										marginLeft: 'auto',
										color: 'red',
									}}
								>
									*필수입력
								</p>
							</div>
							<div className='bdUserInfo'>
								<div
									style={{
										display: 'flex',
										marginBottom: '15px',
									}}
								>
									<h6>
										예약자&nbsp;
										<span style={{color: 'red'}}>*</span>
									</h6>
									<input
										type='text'
										style={{
											width: '85%',
											height: '40px',
											marginLeft: '30px',
										}}
										required
										value={name}
										onChange={(e) =>
											setName(e.target.value)
										}
									/>
								</div>
								<div
									style={{
										display: 'flex',
										marginBottom: '15px',
									}}
								>
									<h6 style={{marginTop: '8px'}}>
										연락처&nbsp;
										<span style={{color: 'red'}}>*</span>
									</h6>
									<input
										type='text'
										style={{
											width: '85%',
											height: '40px',
											marginLeft: '30px',
										}}
										required
										onChange={(e) => {
											return setPhone(e.target.value);
										}}
										value={phone}
									/>
								</div>
								<div
									style={{
										display: 'flex',
										marginBottom: '15px',
									}}
								>
									<h6 style={{marginTop: '8px'}}>
										이메일&nbsp;
										<span style={{color: 'red'}}>*</span>
									</h6>
									<input
										type='email'
										style={{
											width: '85%',
											height: '40px',
											marginLeft: '30px',
										}}
										required
										value={email}
										onChange={(e) =>
											setEmail(e.target.value)
										}
									/>
								</div>
								<div
									style={{
										display: 'flex',
										marginBottom: '15px',
									}}
								>
									<h6 style={{marginTop: '8px'}}>사용목적</h6>
									<input
										type='text'
										style={{
											width: '85%',
											height: '40px',
											marginLeft: '28px',
										}}
										value={purpose}
										onChange={(e) =>
											setPurpose(e.target.value)
										}
									/>
								</div>
								<div
									style={{
										display: 'flex',
										marginBottom: '15px',
									}}
								>
									<h6 style={{marginTop: '8px'}}>요청사항</h6>
									<textarea
										ref={contentRef}
										style={{
											width: '85%',
											height: '100px',
											marginLeft: '28px',
										}}
										className='form-control'
									></textarea>
								</div>
							</div>
							<div className='otherInfo'>
								<BdOtherInfo
									hostNum={hostNum}
									roomNum={num} // roomNum
								/>
							</div>
						</div>
						<div className='dbItem'>
							<BdPayment
								name={name}
								phone={phone}
								email={email}
								date={date}
								stime={stime}
								etime={etime}
								price={price}
								optionInsertList={optionInsertList}
								optionPrice={optionPrice}
								head={head}
								totalPrice={totalPrice}
								roomData={roomData}
								payment={payment}
								onSend={onSend}
							/>
						</div>
					</div>
				</div>
			</form>
		</>
	);
}

export default BookingDetail;
