from xmantissa.offering import Offering

from methanal.theme import Theme
from methanal.publicpage import MethanalPublicPage

plugin = Offering(
    name=u'Methanal',
    description=u'A forms library for Mantissa',
    siteRequirements=[],
    appPowerups=[MethanalPublicPage],
    installablePowerups=[],
    loginInterfaces=[],
    themes=[Theme('methanal-base', 0)])
