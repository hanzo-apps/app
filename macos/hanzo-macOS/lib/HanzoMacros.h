//
//  HanzoMacros.h
//  hanzo
//
//  Created by Oscar on 28.08.22.
//

#ifndef HanzoMacros_h
#define HanzoMacros_h

#define HOSTFN(name, size, capture) \
jsi::Function::createFromHostFunction(rt, jsi::PropNameID::forAscii(rt, name), size, \
capture(jsi::Runtime &rt, const jsi::Value &thisValue, \
const jsi::Value *arguments, size_t count)          \
->jsi::Value


#define JSIFN(capture)                                         \
capture(jsi::Runtime &rt, const jsi::Value &thisValue, \
const jsi::Value *arguments, size_t count)          \
->jsi::Value

#endif /* HanzoMacros_h */
