## build
docker build -t puppeteer-accuranker . 

## push
docker push cmaccuranker/puppeteer-accuranker

## run production
docker run --rm -d --add-host localhost.dk:`ip route show | grep docker0 | grep src | awk '{print $9}'` -p 8088:8080 --cap-add=SYS_ADMIN --name puppeteer-accuranker puppeteer-accuranker yarn start

## run dev
docker run --rm --add-host localhost.dk:`ip route show | grep docker0 | grep src | awk '{print $9}'` -p 8088:8080 --cap-add=SYS_ADMIN --name puppeteer-accuranker puppeteer-accuranker yarn start
