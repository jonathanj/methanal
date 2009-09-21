from nevow.testutil import JavaScriptTestCase



class JSUnitTests(JavaScriptTestCase):
    def test_methanal(self):
        return u'Methanal.Tests.TestMethanal'


    def test_util(self):
        return u'Methanal.Tests.TestUtil'


    def test_validators(self):
        return u'Methanal.Tests.TestValidators'


    def test_deps(self):
        return u'Methanal.Tests.TestDeps'


    def test_view(self):
        return u'Methanal.Tests.TestView'
