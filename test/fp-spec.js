import test from 'ava';
import {fromErr, Left, Right} from '../server/fp';
import {createroom} from '../server/commands/general';

const createRoom = createroom;

const fromBool = (boolExpr, val) =>
  boolExpr ? Right(val) : Left(false);


const config = {sysop: 'admin'};
const testUser1 = {id: 'admin', authenticated: true};
const testUser2 = {id: 'rick', authenticated: true};
const testUser3 = {id: 'admin', authenticated: false};

const errTarget = {text: 'No target or target cannot be greater than 20 characters.'};
const errPermission = {text: 'You don\'t have the permissions to execute this command.'};
const successRoom = normalized => ({text: normalized + ' room is created!'});

function createRoom1(target, room, user) {
    const normalized = target.trim();
    return fromBool(normalized && normalized.length <= 20, user)
      .fold(() => errTarget,
            user => fromBool(config.sysop === user.id && user.authenticated, null)
                      .fold(() => errPermission,
                            () => successRoom(normalized))
           );
}

function createRoom2(target, room, user) {
    const normalized = target.trim();
    const checkTarget = fromErr(normalized && normalized.length <= 20, errTarget);
    const checkPermissions = fromErr(config.sysop === user.id && user.authenticated, errPermission);
    return checkTarget.chain(() => checkPermissions).fold(e => e, () => successRoom(normalized));
}

test('targets', t => {
  t.plan(2);

  t.is(createRoom1('', {}, testUser1), errTarget);
  t.is(createRoom1('123456789123456789123451', {}, testUser1), errTarget);
});

test('permissions', t => {
  t.plan(3);

  t.deepEqual(createRoom1('staff', {}, testUser1), successRoom('staff'));
  t.is(createRoom1('staff', {}, testUser2), errPermission);
  t.is(createRoom1('staff', {}, testUser3), errPermission);
});

test('createRoom1 vs createRoom2', t => {
  t.plan(5);

  t.deepEqual(createRoom2('', {}, testUser1), createRoom1('', {}, testUser1));
  t.deepEqual(createRoom2('lksajdlkajdslakjdlaskjdlasjdl', {}, testUser1), createRoom1('', {}, testUser1));
  t.deepEqual(createRoom2('staff', {}, testUser1), createRoom1('staff', {}, testUser1));
  t.deepEqual(createRoom2('staff', {}, testUser2), createRoom1('staff', {}, testUser2));
  t.deepEqual(createRoom2('staff', {}, testUser3), createRoom1('staff', {}, testUser3));
});

test('createRoom', t => {
  t.plan(5);

  t.deepEqual(createRoom('', {}, testUser1), createRoom1('', {}, testUser1));
  t.deepEqual(createRoom('lksajdlkajdslakjdlaskjdlasjdl', {}, testUser1), createRoom1('', {}, testUser1));
  t.deepEqual(createRoom('staff', {}, testUser1).text, createRoom1('staff', {}, testUser1).text);
  t.deepEqual(createRoom('staff', {}, testUser2), createRoom1('staff', {}, testUser2));
  t.deepEqual(createRoom('staff', {}, testUser3), createRoom1('staff', {}, testUser3));
});
