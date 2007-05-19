
// import Divmod.UnitTest
// import Methanal.Util

Methanal.Tests.TestUtil.TestUtil = Divmod.UnitTest.TestCase.subclass('Methanal.Test.TestUtil.TestUtil');
Methanal.Tests.TestUtil.TestUtil.methods(
    function test_strToInt(self) {
        var CASES = [
            ['1234', 1234],
            ['01234', 1234],
            ['001234', 1234],
            ['019', 19],
            ['123abc', undefined],
            ['abc123', undefined],
            ['0x123', undefined]];

        for (var i = 0; i < CASES.length; ++i) {
            var input = CASES[i][0];
            var expected = CASES[i][1];
            var actual = Methanal.Util.strToInt(input);
            self.assert(expected === actual, 'input = ' + input + ' :: expected = ' + expected + ' :: actual = ' + actual);
        }
    });
