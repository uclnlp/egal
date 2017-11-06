from setuptools import setup, find_packages
import os


setup(
    name='egal',  # This is the name of your PyPI-package.
    version='0.1.4',  # Update the version number for new releases
    scripts=[],  # The name of your script, and also the command you'll be using for calling it
    packages=['egal'],
    author='Sebastian Riedel',
    long_description="A jupyter extension to draw SVG images inline, within cells.",
    url='https://github.com/uclmr/egal',
    author_email='sebastian.riedel@gmail.com',
    include_package_data=True,
    # package_data={'egal': ['egal/static']},
)
