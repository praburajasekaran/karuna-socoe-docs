brew install dopplerhq/cli/doppler # macOS

doppler login --yes

cd /Applications/MAMP/htdocs/kananvisa-react

doppler setup --project kananvisa --config dev --no-interactive || doppler setup


npm run doppler:dev

OR 

npm run doppler:build

npm run doppler:start