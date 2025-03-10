from setuptools import setup, find_packages

setup(
    name="idea_graph",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "networkx",
        "matplotlib"
    ],
    entry_points={
        "console_scripts": [
            "idea-graph=idea_graph.cli:main"
        ]
    },
)
