module.exports = function update(prevState, changes) {
  // type here
  const funcName = Object.keys(changes)[0];
  const valueData = Object.values(changes)[0];
  let copiedPrevState = JSON.parse(JSON.stringify(prevState));
  // 문제 해결을 위해 중복되는 부분들을 변수로 처리

  if (funcName === '$push') {
    // $push의 경우
    return prevState.concat(valueData); // concat의 경우 immutable을 유지하기 때문에 prevState사용(copy로 변경해도 무관)
  } else if (funcName === '$unshift') {
    // $unshift의 경우
    return valueData.concat(prevState); // concat이므로 위와 동일
  } else if (funcName === '$splice') {
    // $splice의 경우
    const spliceDataArr = valueData[0]; // 3중 배열로 되어있기 때문에 2번째로 들어가 nested 배열로 만듬
    const changeArr = spliceDataArr.slice(2); // 확장성을 위해 spread 고려
    copiedPrevState.splice(spliceDataArr[0], spliceDataArr[1], ...changeArr); // delete, index, ...새로운 값들
    return copiedPrevState; // immutable을 위해 copy로 변경한 값을 반환
  } else if (funcName === '$apply') {
    // $apply의 경우
    return valueData(copiedPrevState); // apply는 주어진 함수를 사용해 copy된 결과값을 변경
  } else if (funcName === '$merge') {
    // $merge의 경우
    return Object.assign(copiedPrevState, valueData); // copy에 새로운 객체를 붙여서 반환
  } else if (funcName === '$set') {
    // $set의 경우
    return valueData; // 바로 변경이기 때문에 변경하는 값을 바로 반환해도 무관
  }
  // nested가 고려되지 못한 1차적 문제해결방식

  // set의 nest를 고려한 문제해결
  let keyArr = [];
  let changedValue;
  const getAllKeys = obj => {
    // 재귀과정을 통해 변경될 key값과 value를 구함
    if (obj.hasOwnProperty('$set')) {
      //nested된 인자의 key값이 $set이라면
      changedValue = Object.values(obj)[0]; // 변수에 변경될 value 값을 담고 리턴함
      return;
    } else {
      keyArr.push(Object.keys(obj)[0]); // changes의 값을 받아서 nest된 key들을 배열에 추가
      return getAllKeys(Object.values(obj)[0]); // nested된 인자가 재귀과정을 거침
    }
  };

  getAllKeys(changes); // 위 재귀함수를 실행해서 key와 value를 구함

  const getLastValue = (obj, arr, val) => {
    // while문을 통해 arr의 length 가 0이 될 때까지 순환
    while (arr.length) {
      if (arr.length === 1) {
        // arr length 가 1 일때
        obj[arr.shift()] = val; // 마지막 객체의 키 값에 value값을 바로 적용하고, shift()로 인해 length는 0으로 변함
      } else {
        obj = obj[arr.shift()];
      }
    }
  };
  getLastValue(copiedPrevState, keyArr, changedValue); // 위 함수를 이용해서 copiedPrevState의 값을 변환
  return copiedPrevState;

  // let evalPrevState = 'copiedPrevState'; // eval을 문자열 전환
  // for (key of keyArr) {
  //   evalPrevState += `.${key}`;
  // } // for문으로 eval을 위한 문자열 생성
  // let evalResult =
  //   evalPrevState +
  //   ` = ${
  //     typeof changedValue === 'string'
  //       ? JSON.stringify(changedValue)
  //       : changedValue
  //   }`; // 생성된 key값에 value값을 붙임  copiedPrevState.a.c = 'f'
  // eval(evalResult); // eval을 실행하여 새로운 값을 반환
  // return copiedPrevState;
};
