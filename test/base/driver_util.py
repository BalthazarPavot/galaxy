"""Scripts for drivers of Galaxy functional tests."""

import httplib
import json
import logging
import os
import random
import shutil
import socket
import sys
import tempfile
import threading
import time

from six.moves.urllib.request import urlretrieve

import nose.config
import nose.core
import nose.loader
import nose.plugins.manager

from paste import httpserver

from .tool_shed_util import parse_tool_panel_config
from .nose_util import run
from .instrument import StructuredTestDataPlugin

from galaxy.util import asbool

galaxy_root = os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir, os.path.pardir))
GALAXY_TEST_DIRECTORY = os.path.join(galaxy_root, "test")
GALAXY_TEST_FILE_DIR = "test-data,https://github.com/galaxyproject/galaxy-test-data.git"
TOOL_SHED_TEST_DATA = os.path.join(GALAXY_TEST_DIRECTORY, "tool_shed", "test_data")
FRAMEWORK_TOOLS_DIR = os.path.join(GALAXY_TEST_DIRECTORY, "functional", "tools")
FRAMEWORK_UPLOAD_TOOL_CONF = os.path.join(FRAMEWORK_TOOLS_DIR, "upload_tool_conf.xml")
FRAMEWORK_SAMPLE_TOOLS_CONF = os.path.join(FRAMEWORK_TOOLS_DIR, "samples_tool_conf.xml")
FRAMEWORK_DATATYPES_CONF = os.path.join(FRAMEWORK_TOOLS_DIR, "sample_datatypes_conf.xml")
MIGRATED_TOOL_PANEL_CONFIG = 'config/migrated_tools_conf.xml'
INSTALLED_TOOL_PANEL_CONFIGS = [
    os.environ.get('GALAXY_TEST_SHED_TOOL_CONF', 'config/shed_tool_conf.xml')
]

DEFAULT_LOCALES = "en"

log = logging.getLogger("test_driver")


def setup_tool_shed_tmp_dir():
    tool_shed_test_tmp_dir = os.environ.get('TOOL_SHED_TEST_TMP_DIR', None)
    if tool_shed_test_tmp_dir is None:
        tool_shed_test_tmp_dir = tempfile.mkdtemp()
    # Here's the directory where everything happens.  Temporary directories are created within this directory to contain
    # the hgweb.config file, the database, new repositories, etc.  Since the tool shed browses repository contents via HTTP,
    # the full path to the temporary directroy wher eht repositories are located cannot contain invalid url characters.
    os.environ[ 'TOOL_SHED_TEST_TMP_DIR' ] = tool_shed_test_tmp_dir
    return tool_shed_test_tmp_dir


def configure_environment():
    """Hack up environment for test cases."""
    # no op remove if unused
    if 'HTTP_ACCEPT_LANGUAGE' not in os.environ:
        os.environ[ 'HTTP_ACCEPT_LANGUAGE' ] = DEFAULT_LOCALES

    # Used by get_filename in tool shed's twilltestcase.
    if "TOOL_SHED_TEST_FILE_DIR" not in os.environ:
        os.environ["TOOL_SHED_TEST_FILE_DIR"] = TOOL_SHED_TEST_DATA


def build_logger():
    """Build a logger for test driver script."""
    return log


def setup_galaxy_config(tmpdir, use_test_file_dir=False):
    """Setup environment and build config for test Galaxy instance."""
    if not os.path.exists(tmpdir):
        os.makedirs(tmpdir)
    file_path = os.path.join(tmpdir, 'files')
    template_cache_path = tempfile.mkdtemp(prefix='compiled_templates_', dir=tmpdir)
    new_file_path = tempfile.mkdtemp(prefix='new_files_path_', dir=tmpdir )
    job_working_directory = tempfile.mkdtemp(prefix='job_working_directory_', dir=tmpdir)

    if use_test_file_dir:
        galaxy_test_file_dir = os.environ.get('GALAXY_TEST_FILE_DIR', GALAXY_TEST_FILE_DIR)
        os.environ['GALAXY_TEST_FILE_DIR'] = galaxy_test_file_dir
        first_test_file_dir = galaxy_test_file_dir.split(",")[0]
        if not os.path.isabs(first_test_file_dir):
            first_test_file_dir = os.path.join(galaxy_root, first_test_file_dir)
        library_import_dir = first_test_file_dir
        import_dir = os.path.join(first_test_file_dir, 'users')
        if os.path.exists(import_dir):
            user_library_import_dir = import_dir
        else:
            user_library_import_dir = None
    else:
        user_library_import_dir = None
        library_import_dir = None
    tool_path = os.environ.get('GALAXY_TEST_TOOL_PATH', 'tools')
    tool_dependency_dir = os.environ.get('GALAXY_TOOL_DEPENDENCY_DIR', None)
    if tool_dependency_dir is None:
        tool_dependency_dir = tempfile.mkdtemp(dir=tmpdir, prefix="tool_dependencies")
    config = dict(
        admin_users='test@bx.psu.edu',
        allow_library_path_paste=True,
        allow_user_creation=True,
        allow_user_deletion=True,
        api_allow_run_as='test@bx.psu.edu',
        check_migrate_tools=False,
        file_path=file_path,
        id_secret='changethisinproductiontoo',
        job_working_directory=job_working_directory,
        job_queue_workers=5,
        library_import_dir=library_import_dir,
        log_destination="stdout",
        new_file_path=new_file_path,
        running_functional_tests=True,
        template_cache_path=template_cache_path,
        template_path='templates',
        tool_parse_help=False,
        tool_path=tool_path,
        update_integrated_tool_panel=False,
        use_tasked_jobs=True,
        use_heartbeat=False,
        user_library_import_dir=user_library_import_dir,
    )
    if tool_dependency_dir:
        config["tool_dependency_dir"] = tool_dependency_dir
        # Used by shed's twill dependency stuff - todo read from
        # Galaxy's config API.
        os.environ["GALAXY_TEST_TOOL_DEPENDENCY_DIR"] = tool_dependency_dir
    return config


def nose_config_and_run( argv=None, env=None, ignore_files=[], plugins=None ):
    """Setup a nose context and run tests.

    Tests are specified by argv (defaulting to sys.argv).
    """
    if env is None:
        env = os.environ
    if plugins is None:
        plugins = nose.plugins.manager.DefaultPluginManager()
    if argv is None:
        argv = sys.argv

    test_config = nose.config.Config(
        env=os.environ,
        ignoreFiles=ignore_files,
        plugins=plugins,
    )

    # Add custom plugin to produce JSON data used by planemo.
    test_config.plugins.addPlugin( StructuredTestDataPlugin() )
    test_config.configure( argv )

    result = run( test_config )

    success = result.wasSuccessful()
    return success


def copy_database_template( source, db_path ):
    """Copy a 'clean' sqlite template database.

    From file or URL to specified path for sqlite database.
    """
    db_path_dir = os.path.dirname(db_path)
    if not os.path.exists(db_path_dir):
        os.makedirs(db_path_dir)
    if os.path.exists(source):
        shutil.copy(source, db_path)
        assert os.path.exists(db_path)
    elif source.lower().startswith(("http://", "https://", "ftp://")):
        urlretrieve(source, db_path)
    else:
        raise Exception( "Failed to copy database template from source %s" % source )


def database_conf(db_path, prefix="GALAXY"):
    """Find (and populate if needed) Galaxy database connection."""
    database_auto_migrate = False
    dburi_var = "%s_TEST_DBURI" % prefix
    if dburi_var in os.environ:
        database_connection = os.environ[dburi_var]
    else:
        default_db_filename = "%s.sqlite" % prefix.lower()
        template_var = "%s_TEST_DB_TEMPLATE" % prefix
        db_path = os.path.join(db_path, default_db_filename)
        if template_var in os.environ:
            # Middle ground between recreating a completely new
            # database and pointing at existing database with
            # GALAXY_TEST_DBURI. The former requires a lot of setup
            # time, the latter results in test failures in certain
            # cases (namely tool shed tests expecting clean database).
            copy_database_template(os.environ[template_var], db_path)
            database_auto_migrate = True
        database_connection = 'sqlite:///%s' % db_path
    config = {
        "database_connection": database_connection,
        "database_auto_migrate": database_auto_migrate
    }
    if not database_connection.startswith("sqlite://"):
        config["database_engine_option_max_overflow"] = "20"
        config["database_engine_option_pool_size"] = "10"
    return config


def install_database_conf(db_path, default_merged=False):
    if 'GALAXY_TEST_INSTALL_DBURI' in os.environ:
        install_galaxy_database_connection = os.environ['GALAXY_TEST_INSTALL_DBURI']
    elif asbool(os.environ.get('GALAXY_TEST_INSTALL_DB_MERGED', default_merged)):
        install_galaxy_database_connection = None
    else:
        install_galaxy_db_path = os.path.join(db_path, 'install.sqlite')
        install_galaxy_database_connection = 'sqlite:///%s' % install_galaxy_db_path
    conf = {}
    if install_galaxy_database_connection is not None:
        conf["install_database_connection"] = install_galaxy_database_connection
    return conf


def database_files_path(test_tmpdir, prefix="GALAXY"):
    """Create a mock database/ directory like in GALAXY_ROOT.

    Use prefix to default this if TOOL_SHED_TEST_DBPATH or
    GALAXY_TEST_DBPATH is set in the environment.
    """
    environ_var = "%s_TEST_DBPATH" % prefix
    if environ_var in os.environ:
        db_path = os.environ[environ_var]
    else:
        tempdir = tempfile.mkdtemp(dir=test_tmpdir)
        db_path = os.path.join(tempdir, 'database')
    return db_path


def _get_static_settings():
    """Configuration required for Galaxy static middleware.

    Returns dictionary of the settings necessary for a galaxy App
    to be wrapped in the static middleware.

    This mainly consists of the filesystem locations of url-mapped
    static resources.
    """
    static_dir = os.path.join(galaxy_root, "static")

    # TODO: these should be copied from config/galaxy.ini
    return dict(
        static_enabled=True,
        static_cache_time=360,
        static_dir=static_dir,
        static_images_dir=os.path.join(static_dir, 'images', ''),
        static_favicon_dir=os.path.join(static_dir, 'favicon.ico'),
        static_scripts_dir=os.path.join(static_dir, 'scripts', ''),
        static_style_dir=os.path.join(static_dir, 'june_2007_style', 'blue'),
        static_robots_txt=os.path.join(static_dir, 'robots.txt'),
    )


def get_webapp_global_conf():
    """Get the global_conf dictionary sent to ``app_factory``."""
    # (was originally sent 'dict()') - nothing here for now except static settings
    global_conf = dict()
    global_conf.update( _get_static_settings() )
    return global_conf


def wait_for_http_server(host, port):
    """Wait for an HTTP server to boot up."""
    # Test if the server is up
    for i in range( 10 ):
        # directly test the app, not the proxy
        conn = httplib.HTTPConnection(host, port)
        conn.request( "GET", "/" )
        if conn.getresponse().status == 200:
            break
        time.sleep( 0.1 )
    else:
        template = "Test HTTP server on host %s and port %s did not return '200 OK' after 10 tries"
        message = template % (host, port)
        raise Exception(message)


def serve_webapp(webapp, port=None, host=None):
    """Serve the webapp on a recommend port or a free one.

    Return the port the webapp is running one.
    """
    server = None
    if port is not None:
        server = httpserver.serve( webapp, host=host, port=port, start_loop=False )
    else:
        random.seed()
        for i in range( 0, 9 ):
            try:
                port = str( random.randint( 8000, 10000 ) )
                server = httpserver.serve( webapp, host=host, port=port, start_loop=False )
                break
            except socket.error, e:
                if e[0] == 98:
                    continue
                raise
        else:
            raise Exception( "Unable to open a port between %s and %s to start Galaxy server" % ( 8000, 1000 ) )

    t = threading.Thread( target=server.serve_forever )
    t.start()

    return server, port


def cleanup_directory(tempdir):
    """Clean up temporary files used by test unless GALAXY_TEST_NO_CLEANUP is set.

    Also respect TOOL_SHED_TEST_NO_CLEANUP for legacy reasons.
    """
    skip_cleanup = "GALAXY_TEST_NO_CLEANUP" in os.environ or "TOOL_SHED_TEST_NO_CLEANUP" in os.environ
    if skip_cleanup:
        log.info( "GALAXY_TEST_NO_CLEANUP is on. Temporary files in %s" % tempdir )
        return
    try:
        if os.path.exists(tempdir) and skip_cleanup:
            shutil.rmtree(tempdir)
    except Exception:
        pass


def setup_shed_tools_for_test(app, galaxy_tool_shed_test_file, testing_migrated_tools, testing_installed_tools):
    """Modify Galaxy app's toolbox for migrated or installed tool tests."""
    shed_tools_dict = {}
    if testing_migrated_tools:
        has_test_data, shed_tools_dict = parse_tool_panel_config(MIGRATED_TOOL_PANEL_CONFIG, shed_tools_dict)
    elif testing_installed_tools:
        for shed_tool_config in INSTALLED_TOOL_PANEL_CONFIGS:
            has_test_data, shed_tools_dict = parse_tool_panel_config(shed_tool_config, shed_tools_dict)
    # Persist the shed_tools_dict to the galaxy_tool_shed_test_file.
    with open(galaxy_tool_shed_test_file, 'w') as shed_tools_file:
        shed_tools_file.write(json.dumps(shed_tools_dict))
    if not os.path.isabs(galaxy_tool_shed_test_file):
        galaxy_tool_shed_test_file = os.path.join(galaxy_root, galaxy_tool_shed_test_file)
    os.environ['GALAXY_TOOL_SHED_TEST_FILE'] = galaxy_tool_shed_test_file
    if testing_installed_tools:
        # TODO: Do this without modifying app - that is a pretty violation
        # of Galaxy's abstraction - we shouldn't require app at all let alone
        # be modifying it.

        tool_configs = app.config.tool_configs
        # Eliminate the migrated_tool_panel_config from the app's tool_configs, append the list of installed_tool_panel_configs,
        # and reload the app's toolbox.
        relative_migrated_tool_panel_config = os.path.join(app.config.root, MIGRATED_TOOL_PANEL_CONFIG)
        if relative_migrated_tool_panel_config in tool_configs:
            tool_configs.remove(relative_migrated_tool_panel_config)
        for installed_tool_panel_config in INSTALLED_TOOL_PANEL_CONFIGS:
            tool_configs.append(installed_tool_panel_config)
        from galaxy import tools  # noqa, delay import because this brings in so many modules for small tests
        app.toolbox = tools.ToolBox(tool_configs, app.config.tool_path, app)


__all__ = [
    "cleanup_directory",
    "configure_environment",
    "copy_database_template",
    "build_logger",
    "FRAMEWORK_UPLOAD_TOOL_CONF",
    "FRAMEWORK_SAMPLE_TOOLS_CONF",
    "FRAMEWORK_DATATYPES_CONF",
    "database_conf",
    "get_webapp_global_conf",
    "nose_config_and_run",
    "setup_galaxy_config",
    "setup_shed_tools_for_test",
    "wait_for_http_server",
]
