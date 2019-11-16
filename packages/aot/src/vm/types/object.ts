import { nextValueId, $PropertyKey, $Any, $Primitive, compareIndices, PotentialNonEmptyCompletionType, CompletionTarget, CompletionType, $AnyNonEmpty } from './_shared';
import { $PropertyDescriptor } from './property-descriptor';
import { $Null } from './null';
import { $Boolean } from './boolean';
import { Realm } from '../realm';
import { $String } from './string';
import { $Number } from './number';
import { $Call, $Get, $ValidateAndApplyPropertyDescriptor, $OrdinarySetWithOwnDescriptor } from '../operations';
import { $Function } from './function';
import { $Undefined } from './undefined';
import { $Symbol } from './symbol';

// http://www.ecma-international.org/ecma-262/#sec-object-type
export class $Object<
  T extends string = string,
> {
  public readonly '<$Object>': unknown;

  public readonly id: number = nextValueId();

  public '[[Type]]': PotentialNonEmptyCompletionType;
  public get '[[Value]]'(): Object {
    const obj = {};
    for (const pd of this.propertyDescriptors) {
      // Reflect.defineProperty(obj, pd.name['[[Value]]'], {
        // TODO: materialize
      // })
    }
    return obj;
  }
  public '[[Target]]': CompletionTarget;

  public get isAbrupt(): boolean { return this['[[Type]]'] !== CompletionType.normal; }

  private readonly propertyMap: Map<string | symbol, number> = new Map();
  private readonly propertyDescriptors: $PropertyDescriptor[] = [];
  private readonly propertyKeys: $PropertyKey[] = [];

  public ['[[Prototype]]']: $Object | $Null;
  public ['[[Extensible]]']: $Boolean;

  public get Type(): 'Object' { return 'Object'; }
  public get isEmpty(): false { return false; }
  public get isUndefined(): false { return false; }
  public get isNull(): false { return false; }
  public get isNil(): false { return false; }
  public get isBoolean(): false { return false; }
  public get isNumber(): false { return false; }
  public get isString(): false { return false; }
  public get isSymbol(): false { return false; }
  public get isPrimitive(): false { return false; }
  public get isObject(): true { return true; }
  public get isArray(): boolean { return false; }
  public get isProxy(): boolean { return false; }
  public get isFunction(): boolean { return false; }
  public get isBoundFunction(): boolean { return false; }
  public get isTruthy(): true { return true; }
  public get isFalsey(): false { return false; }
  public get isSpeculative(): false { return false; }
  public get hasValue(): false { return false; }

  public constructor(
    public readonly realm: Realm,
    public readonly IntrinsicName: T,
    proto: $Object | $Null,
    type: PotentialNonEmptyCompletionType = CompletionType.normal,
    target: CompletionTarget = realm['[[Intrinsics]]'].empty,
  ) {
    this['[[Prototype]]'] = proto;
    this['[[Extensible]]'] = realm['[[Intrinsics]]'].true;
    this['[[Type]]'] = type;
    this['[[Target]]'] = target;
  }

  // http://www.ecma-international.org/ecma-262/#sec-objectcreate
  public static ObjectCreate<T extends string = string, TSlots extends {} = {}>(
    IntrinsicName: T,
    proto: $Object,
    internalSlotsList?: TSlots,
  ): $Object<T> & TSlots {
    const realm = proto.realm;

    // 1. If internalSlotsList is not present, set internalSlotsList to a new empty List.
    // 2. Let obj be a newly created object with an internal slot for each name in internalSlotsList.
    const obj = new $Object(realm, IntrinsicName, proto);
    Object.assign(obj, internalSlotsList);

    // 3. Set obj's essential internal methods to the default ordinary object definitions specified in 9.1.
    // 4. Set obj.[[Prototype]] to proto.
    // 5. Set obj.[[Extensible]] to true.
    // 6. Return obj.
    return obj as $Object<T> & TSlots;
  }

  public is(other: $Any): other is $Object<T> {
    return this.id === other.id;
  }

  public ToCompletion(
    type: PotentialNonEmptyCompletionType,
    target: CompletionTarget,
  ): this {
    this['[[Type]]'] = type;
    this['[[Target]]'] = target;
    return this;
  }

  // http://www.ecma-international.org/ecma-262/#sec-updateempty
  public UpdateEmpty(value: $Any): this {
    // 1. Assert: If completionRecord.[[Type]] is either return or throw, then completionRecord.[[Value]] is not empty.
    // 2. If completionRecord.[[Value]] is not empty, return Completion(completionRecord).
    return this;
    // 3. Return Completion { [[Type]]: completionRecord.[[Type]], [[Value]]: value, [[Target]]: completionRecord.[[Target]] }.
  }

  public ToObject(): this {
    return this;
  }

  public ToPropertyKey(): $String {
    return this.ToString();
  }

  public ToLength(): $Number {
    return this.ToNumber().ToLength();
  }

  public ToBoolean(): $Boolean {
    return this.ToPrimitive('number').ToBoolean();
  }

  public ToNumber(): $Number {
    return this.ToPrimitive('number').ToNumber();
  }

  public ToInt32(): $Number {
    return this.ToPrimitive('number').ToInt32();
  }

  public ToUint32(): $Number {
    return this.ToPrimitive('number').ToUint32();
  }

  public ToInt16(): $Number {
    return this.ToPrimitive('number').ToInt16();
  }

  public ToUint16(): $Number {
    return this.ToPrimitive('number').ToUint16();
  }

  public ToInt8(): $Number {
    return this.ToPrimitive('number').ToInt8();
  }

  public ToUint8(): $Number {
    return this.ToPrimitive('number').ToUint8();
  }

  public ToUint8Clamp(): $Number {
    return this.ToPrimitive('number').ToUint8Clamp();
  }

  public ToString(): $String {
    return this.ToPrimitive('string').ToString();
  }

  // http://www.ecma-international.org/ecma-262/#sec-toprimitive
  public ToPrimitive(PreferredType: 'default' | 'string' | 'number' = 'default'): $Primitive {
    const realm = this.realm;
    const intrinsics = realm['[[Intrinsics]]'];
    const input = this;

    // 1. Assert: input is an ECMAScript language value.
    // 2. If Type(input) is Object, then
    // 2. a. If PreferredType is not present, let hint be "default".
    // 2. b. Else if PreferredType is hint String, let hint be "string".
    // 2. c. Else PreferredType is hint Number, let hint be "number".
    let hint = intrinsics[PreferredType];

    // 2. d. Let exoticToPrim be ? GetMethod(input, @@toPrimitive).
    const exoticToPrim = input.GetMethod(intrinsics['@@toPrimitive']);

    // 2. e. If exoticToPrim is not undefined, then
    if (!exoticToPrim.isUndefined) {
      // 2. e. i. Let result be ? Call(exoticToPrim, input, « hint »).
      const result = $Call(exoticToPrim, input, [hint]);

      // 2. e. ii. If Type(result) is not Object, return result.
      if (result.isPrimitive) {
        return result;
      }

      // 2. e. iii. Throw a TypeError exception.
      throw new TypeError('2. e. iii. Throw a TypeError exception.');
    }

    // 2. f. If hint is "default", set hint to "number".
    if (hint['[[Value]]'] === 'default') {
      hint = intrinsics.number;
    }

    // 2. g. Return ? OrdinaryToPrimitive(input, hint).
    return input.OrdinaryToPrimitive(hint['[[Value]]']);

    // 3. Return input.
    // N/A since this is always an object
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinarytoprimitive
  public OrdinaryToPrimitive(hint: 'string' | 'number'): $Primitive {
    const realm = this.realm;
    const intrinsics = realm['[[Intrinsics]]'];
    const O = this;

    // 1. Assert: Type(O) is Object.
    // 2. Assert: Type(hint) is String and its value is either "string" or "number".
    // 3. If hint is "string", then
    if (hint === 'string') {
      // 3. a. Let methodNames be « "toString", "valueOf" ».
      // 5. For each name in methodNames in List order, do
      // 5. a. Let method be ? Get(O, name).
      let method = $Get(O, intrinsics.$toString);

      // 5. b. If IsCallable(method) is true, then
      if (method.isFunction) {
        // 5. b. i. Let result be ? Call(method, O).
        const result = $Call(method as $Function, O);

        // 5. b. ii. If Type(result) is not Object, return result.
        if (result.isPrimitive) {
          return result;
        }
      }

      method = $Get(O, intrinsics.$valueOf);

      // 5. b. If IsCallable(method) is true, then
      if (method.isFunction) {
        // 5. b. i. Let result be ? Call(method, O).
        const result = $Call(method as $Function, O);

        // 5. b. ii. If Type(result) is not Object, return result.
        if (result.isPrimitive) {
          return result;
        }
      }

      // 6. Throw a TypeError exception.
      throw new TypeError('6. Throw a TypeError exception.');
    }
    // 4. Else,
    else {
      // 4. a. Let methodNames be « "valueOf", "toString" ».
      // 5. For each name in methodNames in List order, do
      // 5. a. Let method be ? Get(O, name).
      let method = $Get(O, intrinsics.$valueOf);

      // 5. b. If IsCallable(method) is true, then
      if (method.isFunction) {
        // 5. b. i. Let result be ? Call(method, O).
        const result = $Call(method as $Function, O);

        // 5. b. ii. If Type(result) is not Object, return result.
        if (result.isPrimitive) {
          return result;
        }
      }

      method = $Get(O, intrinsics.$toString);

      // 5. b. If IsCallable(method) is true, then
      if (method.isFunction) {
        // 5. b. i. Let result be ? Call(method, O).
        const result = $Call(method as $Function, O);

        // 5. b. ii. If Type(result) is not Object, return result.
        if (result.isPrimitive) {
          return result;
        }
      }

      // 6. Throw a TypeError exception.
      throw new TypeError('6. Throw a TypeError exception.');
    }
  }

  public GetValue(): this {
    return this;
  }

  // http://www.ecma-international.org/ecma-262/#sec-getmethod
  public GetMethod(P: $PropertyKey): $Function | $Undefined {
    const realm = this.realm;
    const intrinsics = realm['[[Intrinsics]]'];
    const V = this;

    // 1. Assert: IsPropertyKey(P) is true.
    // 2. Let func be ? GetV(V, P).
    const func = V['[[Get]]'](P, V);

    // 3. If func is either undefined or null, return undefined.
    if (func.isNil) {
      return intrinsics.undefined;
    }

    // 4. If IsCallable(func) is false, throw a TypeError exception.
    if (!func.isFunction) {
      throw new TypeError('If IsCallable(func) is false, throw a TypeError exception.');
    }

    // 5. Return func.
    return func as $Function;
  }

  protected hasProperty(key: $PropertyKey): boolean {
    return this.propertyMap.has(key['[[Value]]']);
  }

  protected getProperty(key: $PropertyKey): $PropertyDescriptor {
    return this.propertyDescriptors[this.propertyMap.get(key['[[Value]]'])!];
  }

  protected setProperty(desc: $PropertyDescriptor): void {
    if (this.propertyMap.has(desc.name['[[Value]]'])) {
      const idx = this.propertyMap.get(desc.name['[[Value]]'])!;
      this.propertyDescriptors[idx] = desc;
      this.propertyKeys[idx] = desc.name;
    } else {
      const idx = this.propertyDescriptors.length;
      this.propertyDescriptors[idx] = desc;
      this.propertyKeys[idx] = desc.name;
      this.propertyMap.set(desc.name['[[Value]]'], idx);
    }
  }

  protected deleteProperty(key: $PropertyKey): void {
    const idx = this.propertyMap.get(key['[[Value]]'])!;
    this.propertyMap.delete(key['[[Value]]']);
    this.propertyDescriptors.splice(idx, 1)
    this.propertyKeys.splice(idx, 1)
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-getprototypeof
  public '[[GetPrototypeOf]]'(): $Object | $Null {
    // 1. Return ! OrdinaryGetPrototypeOf(O)

    // http://www.ecma-international.org/ecma-262/#sec-ordinarygetprototypeof
    const O = this;

    // 1. Return O.[[Prototype]].
    return O['[[Prototype]]'];
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-setprototypeof-v
  public '[[SetPrototypeOf]]'(V: $Object | $Null): $Boolean {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return ! OrdinarySetPrototypeOf(O, V).

    // http://www.ecma-international.org/ecma-262/#sec-ordinarysetprototypeof
    const O = this;

    // 1. Assert: Either Type(V) is Object or Type(V) is Null.
    // 2. Let extensible be O.[[Extensible]].
    const extensible = O['[[Extensible]]']['[[Value]]'];

    // 3. Let current be O.[[Prototype]].
    const current = O['[[Prototype]]'];

    // 4. If SameValue(V, current) is true, return true.
    if (V.is(current)) {
      return intrinsics.true;
    }

    // 5. If extensible is false, return false.
    if (!extensible) {
      return intrinsics.false;
    }

    // 6. Let p be V.
    let p = V;

    // 7. Let done be false.
    let done = false;

    // 8. Repeat, while done is false,
    while (!done) {
      // 8. a. If p is null, set done to true.
      if (p.isNull) {
        done = true;
      }
      // 8. b. Else if SameValue(p, O) is true, return false.
      else if (p.is(O)) {
        return intrinsics.false;
      }
      // 8. c. Else,
      else {
        // 8. c. i. If p.[[GetPrototypeOf]] is not the ordinary object internal method defined in 9.1.1, set done to true.
        if (p['[[GetPrototypeOf]]'] !== $Object.prototype['[[GetPrototypeOf]]']) {
          done = true;
        }
        // 8. c. ii. Else, set p to p.[[Prototype]].
        else {
          p = p['[[Prototype]]'];
        }
      }
    }

    // 9. Set O.[[Prototype]] to V.
    O['[[Prototype]]'] = V;

    // 10. Return true.
    return intrinsics.true;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-isextensible
  public '[[IsExtensible]]'(): $Boolean {
    // 1. Return ! OrdinaryIsExtensible(O).

    // http://www.ecma-international.org/ecma-262/#sec-ordinaryisextensible
    const O = this;

    // 1. Return O.[[Extensible]].
    return O['[[Extensible]]'];
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-preventextensions
  public '[[PreventExtensions]]'(): $Boolean {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return ! OrdinaryPreventExtensions(O).

    // http://www.ecma-international.org/ecma-262/#sec-ordinarypreventextensions
    const O = this;

    // 1. Set O.[[Extensible]] to false.
    O['[[Extensible]]'] = intrinsics.false;

    // 2. Return true.
    return intrinsics.true;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-getownproperty-p
  public '[[GetOwnProperty]]'(P: $PropertyKey): $PropertyDescriptor | $Undefined {
    const realm = this.realm;
    const intrinsics = realm['[[Intrinsics]]'];

    // 1. Return ! OrdinaryGetOwnProperty(O, P).

    // http://www.ecma-international.org/ecma-262/#sec-ordinarygetownproperty
    const O = this;

    // 1. Assert: IsPropertyKey(P) is true.
    // 2. If O does not have an own property with key P, return undefined.
    if (!O.hasProperty(P)) {
      return intrinsics.undefined;
    }

    // 3. Let D be a newly created Property Descriptor with no fields.
    const D = new $PropertyDescriptor(realm, P);

    // 4. Let X be O's own property whose key is P.
    const X = O.getProperty(P);

    // 5. If X is a data property, then
    if (X.isDataDescriptor) {
      // 5. a. Set D.[[Value]] to the value of X's [[Value]] attribute.
      D['[[Value]]'] = X['[[Value]]'];

      // 5. b. Set D.[[Writable]] to the value of X's [[Writable]] attribute.
      D['[[Writable]]'] = X['[[Writable]]'];
    }
    // 6. Else X is an accessor property,
    else {
      // 6. a. Set D.[[Get]] to the value of X's [[Get]] attribute.
      D['[[Get]]'] = X['[[Get]]'];

      // 6. b. Set D.[[Set]] to the value of X's [[Set]] attribute.
      D['[[Set]]'] = X['[[Set]]'];
    }

    // 7. Set D.[[Enumerable]] to the value of X's [[Enumerable]] attribute.
    D['[[Enumerable]]'] = X['[[Enumerable]]'];

    // 8. Set D.[[Configurable]] to the value of X's [[Configurable]] attribute.
    D['[[Configurable]]'] = X['[[Configurable]]'];

    // 9. Return D.
    return D;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-defineownproperty-p-desc
  public '[[DefineOwnProperty]]'(P: $PropertyKey, Desc: $PropertyDescriptor): $Boolean {
    // 1. Return ? OrdinaryDefineOwnProperty(O, P, Desc).
    const O = this;

    // http://www.ecma-international.org/ecma-262/#sec-ordinarydefineownproperty

    // 1. Let current be ? O.[[GetOwnProperty]](P).
    const current = O['[[GetOwnProperty]]'](P);

    // 2. Let extensible be ? IsExtensible(O).
    const extensible = O['[[IsExtensible]]']();

    // 3. Return ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current).
    return $ValidateAndApplyPropertyDescriptor(O, P, extensible, Desc, current);
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-hasproperty-p
  public '[[HasProperty]]'(P: $PropertyKey): $Boolean {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return ? OrdinaryHasProperty(O, P).

    // http://www.ecma-international.org/ecma-262/#sec-ordinaryhasproperty
    const O = this;

    // 1. Assert: IsPropertyKey(P) is true.

    // 2. Let hasOwn be ? O.[[GetOwnProperty]](P).
    const hasOwn = O['[[GetOwnProperty]]'](P);

    // 3. If hasOwn is not undefined, return true.
    if (!hasOwn.isUndefined) {
      return intrinsics.true;
    }

    // 4. Let parent be ? O.[[GetPrototypeOf]]().
    const parent = O['[[GetPrototypeOf]]']();

    // 5. If parent is not null, then
    if (!parent.isNull) {
      // 5. a. Return ? parent.[[HasProperty]](P).
      return parent['[[HasProperty]]'](P);
    }

    // 6. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-get-p-receiver
  public '[[Get]]'(P: $PropertyKey, Receiver: $AnyNonEmpty): $AnyNonEmpty {
    const intrinsics = this.realm['[[Intrinsics]]'];
    // 1. Return ? OrdinaryGet(O, P, Receiver).

    // http://www.ecma-international.org/ecma-262/#sec-ordinaryget
    const O = this;

    // 1. Assert: IsPropertyKey(P) is true.
    // 2. Let desc be ? O.[[GetOwnProperty]](P).
    const desc = O['[[GetOwnProperty]]'](P);

    // 3. If desc is undefined, then
    if (desc.isUndefined) {
      // 3. a. Let parent be ? O.[[GetPrototypeOf]]().
      const parent = O['[[GetPrototypeOf]]']();

      // 3. b. If parent is null, return undefined.
      if (parent.isNull) {
        return intrinsics.undefined;
      }

      // 3. c. Return ? parent.[[Get]](P, Receiver).
      return parent['[[Get]]'](P, Receiver);
    }

    // 4. If IsDataDescriptor(desc) is true, return desc.[[Value]].
    if (desc.isDataDescriptor) {
      return desc['[[Value]]'] as $AnyNonEmpty;
    }

    // 5. Assert: IsAccessorDescriptor(desc) is true.
    // 6. Let getter be desc.[[Get]].
    const getter = desc['[[Get]]'] as $Function | $Undefined;

    // 7. If getter is undefined, return undefined.
    if (getter.isUndefined) {
      return getter;
    }

    // 8. Return ? Call(getter, Receiver).
    return $Call(getter, Receiver);
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-set-p-v-receiver
  public '[[Set]]'(P: $PropertyKey, V: $AnyNonEmpty, Receiver: $Object): $Boolean {
    // 1. Return ? OrdinarySet(O, P, V, Receiver).

    // http://www.ecma-international.org/ecma-262/#sec-ordinaryset
    const O = this;

    // 1. Assert: IsPropertyKey(P) is true.
    // 2. Let ownDesc be ? O.[[GetOwnProperty]](P).
    const ownDesc = O['[[GetOwnProperty]]'](P);

    // 3. Return OrdinarySetWithOwnDescriptor(O, P, V, Receiver, ownDesc).
    return $OrdinarySetWithOwnDescriptor(O, P, V, Receiver, ownDesc);
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-delete-p
  public '[[Delete]]'(P: $PropertyKey): $Boolean {
    const intrinsics = this.realm['[[Intrinsics]]'];

    // 1. Return ? OrdinaryDelete(O, P).

    // http://www.ecma-international.org/ecma-262/#sec-ordinarydelete
    const O = this;

    // 1. Assert: IsPropertyKey(P) is true.
    // 2. Let desc be ? O.[[GetOwnProperty]](P).
    const desc = O['[[GetOwnProperty]]'](P);

    // 3. If desc is undefined, return true.
    if (desc.isUndefined) {
      return intrinsics.true;
    }

    // 4. If desc.[[Configurable]] is true, then
    if (desc['[[Configurable]]'].isTruthy) {
      // 4. a. Remove the own property with name P from O.
      O.deleteProperty(P);

      // 4. b. Return true.
      return intrinsics.true;
    }

    // 5. Return false.
    return intrinsics.false;
  }

  // http://www.ecma-international.org/ecma-262/#sec-ordinary-object-internal-methods-and-internal-slots-ownpropertykeys
  public '[[OwnPropertyKeys]]'(): readonly $PropertyKey[] {
    // 1. Return ! OrdinaryOwnPropertyKeys(O).

    // http://www.ecma-international.org/ecma-262/#sec-ordinaryownpropertykeys

    // 1. Let keys be a new empty List.
    const keys = [] as $PropertyKey[];

    let arrayIndexLen = 0;
    let stringLen = 0;
    let symbolLen = 0;
    let arrayIndexProps: $String[] = [];
    let stringProps: $String[] = [];
    let symbolProps: $Symbol[] = [];

    const ownPropertyKeys = this.propertyKeys;
    let ownPropertyKey: $PropertyKey;
    for (let i = 0, ii = ownPropertyKeys.length; i < ii; ++i) {
      ownPropertyKey = ownPropertyKeys[i];
      if (ownPropertyKey.isString) {
        if (ownPropertyKey.IsArrayIndex) {
          arrayIndexProps[arrayIndexLen++] = ownPropertyKey;
        } else {
          stringProps[stringLen++] = ownPropertyKey;
        }
      } else {
        symbolProps[symbolLen++] = ownPropertyKey;
      }
    }

    arrayIndexProps.sort(compareIndices);

    let i = 0;
    let keysLen = 0;

    // 2. For each own property key P of O that is an array index, in ascending numeric index order, do
    for (i = 0; i < arrayIndexLen; ++i) {
      // 2. a. Add P as the last element of keys.
      keys[keysLen++] = arrayIndexProps[i];
    }

    // 3. For each own property key P of O that is a String but is not an array index, in ascending chronological order of property creation, do
    for (i = 0; i < stringLen; ++i) {
      // 3. a. Add P as the last element of keys.
      keys[keysLen++] = stringProps[i];
    }

    // 4. For each own property key P of O that is a Symbol, in ascending chronological order of property creation, do
    for (i = 0; i < symbolLen; ++i) {
      // 4. a. Add P as the last element of keys.
      keys[keysLen++] = symbolProps[i];
    }

    // 5. Return keys.
    return keys;
  }
}