image="auto-sklearn"
tag="training"

account=$(aws sts get-caller-identity --query Account --output text)
region=$(aws configure get region)
registry="${account}.dkr.ecr.${region}.amazonaws.com"
repository="${registry}/${image}:${tag}"

aws ecr get-login-password --region ${region} | docker login --username AWS --password-stdin ${registry}

docker build --tag ${repository} .
docker push ${repository}