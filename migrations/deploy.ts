// Migrations are an early feature. Currently, they're nothing more than this
// single deploy script that's invoked from the CLI, injecting a provider
// configured from the workspace's TrezoaAnchor.toml.

const trezoaanchor = require("@trezoa-xyz/trezoaanchor");

module.exports = async function (provider) {
  // Configure client to use the provider.
  trezoaanchor.setProvider(provider);

  // Add your deploy script here.
};
