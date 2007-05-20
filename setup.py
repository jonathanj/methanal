from epsilon.setuphelper import autosetup

from methanal import version

raise RuntimeError('This is broken')

autosetup(
    name='Methanal',
    version=version.short(),
    maintainer='Tristan Seligmann',
    maintainer_email='mithrandi@mithrandi.za.net',
    license='MIT',
    platforms=['any'],
    description='A web forms library for Mantissa',
    classifiers=[
        'Intended Audience :: Developers',
        'Programming Language :: Python',
        'Development Status :: 3 - Alpha',
        'Topic :: Internet'],
    )
