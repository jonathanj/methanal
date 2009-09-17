from twisted.python import log
from twisted.python.failure import Failure
from twisted.python.util import mergeFunctionMetadata



class MethodWrapper(object):
    """
    Wrapper around a class method.

    @type unboundMethod: C{callable}
    @ivar unboundMethod: Unbound method

    @type cls: C{type}
    @ivar cls: Type that L{unboundMethod} is a method of

    @type instance: C{instance}
    @ivar instance: Instance to invoke L{unboundMethod} with
    """
    def __init__(self, unboundMethod, cls, instance):
        self.unboundMethod = unboundMethod
        self.cls = cls
        self.instance = instance


    def __call__(self, *a, **kw):
        return self.unboundMethod(self.instance, *a, **kw)



def collectMethods(inst, methodName):
    """
    Traverse an object's MRO, collecting methods.

    Collected methods are wrapped with L{MethodWrapper}.

    @type inst: C{type}
    @param inst: Type instance whose L{methodName} methods should be collected

    @type methodName: C{str}
    @param methodName: Name of the method, along the MRO, to collect

    @rtype: C{iterable} of L{MethodWrapper} instances
    @return: Wrapped methods named L{methodName} along L{inst}'s MRO
    """
    for cls in type(inst).__mro__:
        try:
            method = cls.__dict__[methodName]
        except KeyError:
            pass
        else:
            yield MethodWrapper(method, cls, inst)



def getArgsDict(inst):
    """
    Collect arguments along a class hierarchy.

    Arguments are collected by traversing the MRO in reverse order, looking
    for C{getArgs} methods, which should return a single C{dict} mapping
    C{unicode} keys to values.

    @type inst: C{type}
    @param inst: Type instance whose C{getArgs} results should be collected

    @raise ValueError: If a key is specified more than once
    @raise TypeError: If a key is not a C{unicode} instance

    @rtype: C{dict}
    @return: A dictionary combining the results of all C{getArgs} methods
        in C{inst}'s class hierarchy
    """
    args = {}
    for getter in collectMethods(inst, 'getArgs'):
        for key, value in getter().iteritems():
            if key in args:
                raise ValueError(
                    'Argument %r from %r already specified' % (key, getter.cls))
            if not isinstance(key, unicode):
                raise TypeError(
                    'Argument name %r is not unicode' % (key,))
            args[key] = value
    return args



class Porthole(object):
    """
    Observable event source.

    A porthole is the link between event emitters, and event observers. Any
    event (which are arbitrary objects) emitted will be broadcast to all
    observers registered with the porthole at that point in time.

    @type observers: C{list} of C{callable}
    """
    def __init__(self):
        self.observers = []


    def addObserver(self, observer):
        """
        Add a observer.

        This is a callable that will be invoked when a response is received for
        a finance application submission.

        @type observer: C{callable} taking one parameter
        @param observer: A callable, that participates in event broadcasting,
            taking one argument: C{event}

        @rtype: C{callable} taking no parameters
        @return: A callable that will remove L{observer} from the Porthole's
            observers
        """
        self.observers.append(observer)
        return lambda: self.observers.remove(observer)


    def emitEvent(self, event):
        """
        Emit an event to all attached observers.

        @param event: Object, representing event information, to pass to all
            attached observers
        """
        if isinstance(event, Failure):
            log.err(event)

        # Copy the list so that observers mutating the list won't wreak havoc.
        for observer in list(self.observers):
            observer(event)



def propertyMaker(func):
    """
    Create a property from C{func}'s return values.

    @type func: C{callable} returning an iterable
    @param func: Callable whose return values are passed on as positional
        arguments to C{property}

    @rtype: C{property} instance
    """
    return property(*func())



def memoise(attrName):
    """
    Decorator for memoising a function's return value.

    @type  attrName: C{str}
    @param attrName: Attribute name to store the memoised value in
    """
    def _memoise(f):
        def _memoised(self, *a, **kw):
            try:
                return getattr(self, attrName)
            except AttributeError:
                value = f(self, *a, **kw)
                setattr(self, attrName, value)
                return value
        return mergeFunctionMetadata(f, _memoised)
    return _memoise
