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
