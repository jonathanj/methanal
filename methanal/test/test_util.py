from twisted.trial.unittest import TestCase

from methanal.util import collectMethods, getArgsDict, Porthole


class MethodCollectorTests(TestCase):
    def test_simpleUsage(self):
        class A(object):
            def foo(self):
                return 'A'

        class B(A):
            def foo(self):
                return 'B'

        results = [m() for m in collectMethods(B(), 'foo')]
        self.assertEquals(results, ['B', 'A'])

    def test_missingMethod(self):
        class A(object):
            def foo(self):
                return 'A'

        class B(A):
            pass

        class C(B):
            def foo(self):
                return 'C'

        results = [m() for m in collectMethods(C(), 'foo')]
        self.assertEquals(results, ['C', 'A'])

    def test_noneAttribute(self):
        """
        Test that None attributes named the same as the method we are
        collecting are not silently ignored.
        """
        class A(object):
            foo = None

        class B(A):
            pass

        results1 = list(collectMethods(A(), 'foo'))
        self.assertEquals(len(results1), 1)

        results2 = list(collectMethods(B(), 'foo'))
        self.assertEquals(len(results2), 1)

        self.assertRaises(TypeError, results2[0])

    def test_argumentCollection(self):
        class A(object):
            """
            Test class with correct getArgs implementation.
            """
            def getArgs(self):
                return {u'foo': 1}

        class B(A):
            """
            Another test getArgs implementor.
            """
            def getArgs(self):
                return {u'bar': 2}

        self.assertEquals(getArgsDict(A()), {u'foo': 1})
        self.assertEquals(getArgsDict(B()), {u'foo': 1, u'bar': 2})

    def test_argumentCollision(self):
        class A(object):
            """
            Test class with correct getArgs implementation.
            """
            def getArgs(self):
                return {u'foo': 1}

        class B(A):
            """
            A getArgs implementor with a colliding argument name.
            """
            def getArgs(self):
                return {u'foo': 2}

        self.assertRaises(ValueError, getArgsDict, B())

    def test_argumentNameType(self):
        class A(object):
            """
            A getArgs implementor with an argument name of the wrong type.
            """
            def getArgs(self):
                return {'foo': 1}

        self.assertRaises(TypeError, getArgsDict, A())


class PortholeTests(TestCase):
    """
    Tests for L{Porthole}.
    """
    def setUp(self):
        """
        Set up a basic test porthole.
        """
        self.emitter = Porthole()

    def test_noObservers(self):
        """
        Emitting an event when there are no observers does nothing.
        """
        self.emitter.emitEvent(u'anEvent')
        self.assertEqual(self.emitter.observers, [])

    def test_addObserver(self):
        """
        Invoking C{addObserver} adds an observer to the list, and returns a
        callable that can be used to remove the observer again.
        """
        r = self.emitter.addObserver(None)
        self.assertEqual(self.emitter.observers, [None])
        r()
        self.assertEqual(self.emitter.observers, [])

    def test_twoObservers(self):
        """
        Emitting an event when there are two observers causes two callbacks to
        occur.
        """
        self.observed = 0
        def _obs(event):
            self.observed += 1

        self.emitter.addObserver(_obs)
        self.emitter.addObserver(_obs)
        self.emitter.emitEvent(u'anEvent')
        self.assertEqual(self.observed, 2)
        self.assertEqual(len(self.emitter.observers), 2)

    def test_reentrancy(self):
        """
        Adding or removing observers from within an observer callback have no
        effect on the event currently being emitted.
        """
        def _obs(event):
            self.observed += 1

        def _obsWithRemove(event):
            self.observed += 1
            r()
            r2()

        def _obsWithAdd(event):
            self.observed += 1
            self.emitter.addObserver(_obsWithAdd)

        r = self.emitter.addObserver(_obsWithRemove)
        r2 = self.emitter.addObserver(_obs)

        self.observed = 0
        self.emitter.emitEvent(u'anEvent')
        self.assertEqual(self.observed, 2)
        self.assertEqual(len(self.emitter.observers), 0)

        self.emitter.addObserver(_obsWithAdd)
        self.observed = 0
        self.emitter.emitEvent(u'anEvent')
        self.assertEqual(self.observed, 1)
        self.assertEqual(len(self.emitter.observers), 2)

        self.observed = 0
        self.emitter.emitEvent(u'anEvent')
        self.assertEqual(self.observed, 2)
        self.assertEqual(len(self.emitter.observers), 4)
