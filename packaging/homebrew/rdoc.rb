# Homebrew formula stub for rdoc
# Not yet submitted upstream — fill url/sha256 from a real GitHub release tarball.
#
# Local tap sketch:
#   brew install --build-from-source ./packaging/homebrew/rdoc.rb
#
# class name must match the formula file (rdoc.rb → Rdoc).

class Rdoc < Formula
  desc "CLI for .rdoc — self-contained responsive offline documents"
  homepage "https://github.com/DokaiiMob/rdoc"
  url "https://github.com/DokaiiMob/rdoc/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "0000000000000000000000000000000000000000000000000000000000000000"
  license "MIT"
  head "https://github.com/DokaiiMob/rdoc.git", branch: "main"

  depends_on "node" => :build

  def install
    system "npm", "ci"
    system "npm", "run", "build"
    libexec.install Dir["*"]
    bin.install_symlink libexec/"dist/cli.js" => "rdoc"
  end

  test do
    assert_match "rdoc", shell_output("#{bin}/rdoc --help")
  end
end
