from twisted.python.failure import Failure


class MethodWrapper(object):
    def __init__(self, unboundMethod, cls, instance):
        self.unboundMethod = unboundMethod
        self.cls = cls
        self.instance = instance

    def __call__(self, *a, **kw):
        return self.unboundMethod(self.instance, *a, **kw)


def collectMethods(inst, methodName):
    for cls in type(inst).__mro__:
        try:
            method = cls.__dict__[methodName]
        except KeyError:
            pass
        else:
            yield MethodWrapper(method, cls, inst)


def getArgsDict(inst):
    """
    Collect arguments for C{inst}.

    Arguments are collected by traversing the MRO in reverse order, looking
    for C{getArgs} methods.

    @rtype: C{dict}
    """
    args = {}
    for getter in collectMethods(inst, 'getArgs'):
        for key, value in getter().iteritems():
            if key in args:
                raise ValueError('Argument %r from %r already specified' % (key, getter.cls))
            if not isinstance(key, unicode):
                raise TypeError('Argument name %r is not unicode' % (key,))
            args[key] = value
    return args


class Porthole(object):
    """
    Observable event source.

    A porthole is the link between event emitters, and event observers. Any
    event (which are arbitrary objects) emitted will be broadcast to all
    observers registered with the porthole at that point in time.
    """
    def __init__(self):
        self.observers = []

    def addObserver(self, observer):
        """
        Add a observer.

        This is a callable that will be invoked when a response is received for
        a finance application submission.

        @param observer: A callable with the signature C{observer(source, event)}.
        @returns: A callable that will stop this observer from receiving future
                  events.
        """
        self.observers.append(observer)
        return lambda: self.observers.remove(observer)

    def emitEvent(self, event):
        """
        Emit an event. The event will be broadcast to all currently attached
        observers.
        """
        if isinstance(event, Failure):
            log.err(event)

        # Copy the list so that observers mutating the list won't wreak havoc
        for observer in list(self.observers):
            observer(event)
