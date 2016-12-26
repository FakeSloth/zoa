// @flow weak

const Right = x =>
({
  chain: f => f(x),
  map: f => Right(f(x)),
  fold: (f, g) => g(x),
  inspect: () => `Right(${x})`
});

const Left = x =>
({
  chain: f => Left(x),
  map: f => Left(x),
  fold: (f, g) => f(x),
  inspect: () => `Left(${x})`
});

const fromErr = (boolExpr, val) =>
  boolExpr ? Right() : Left(val);

module.exports = {
  Right,
  Left,
  fromErr
};
