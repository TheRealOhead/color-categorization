class Vec3 {
	constructor(x, y, z) {
		this.x = x;
		this.y = y;
		this.z = z;
	}

	add(other) {
		return new Vec3(
			this.x + other.x,
			this.y + other.y,
			this.z + other.z,
		);
	}

	multiply(scalar) {
		return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar)
	}
}

class DataPoint {
	constructor(location, data) {
		this.location = location;
		this.data = data;
	}
}

class Cube {
	static indexToCorner(i) {
		return new Vec3(
			i % 2,
			(i >> 1) % 2,
			(i >> 2) % 2
		);
	}

	constructor(corner, sideLength, capacity, parent) {
		this.capacity = capacity;
		this.corner = corner;
		this.sideLength = sideLength;
		this.parent = parent;

		this.isLeaf = true;

		this.dataPoints = [];
	}

	findAppropriateCube(location) {
		if (this.isLeaf) return this;

		return this.childCubes[
			(location.x < this.corner.x + this.sideLength / 2 ? 0 : 1) +
			(location.y < this.corner.y + this.sideLength / 2 ? 0 : 2) +
			(location.z < this.corner.z + this.sideLength / 2 ? 0 : 4) 
		].findAppropriateCube(location);
	}

	add(dataPoint) {
		const appropriateCube = this.findAppropriateCube(dataPoint.location);
		appropriateCube.dataPoints.push(dataPoint);
		if (appropriateCube.dataPoints.length > appropriateCube.capacity) appropriateCube.unleaf();
	}

	unleaf() {
		if (!this.isLeaf) return;

		this.isLeaf = false;

		this.childCubes = [];

		for (let i = 0; i < 8; i++) {
			const indexedCorner = Cube.indexToCorner(i);
			this.childCubes[i] = new Cube(this.corner.add(indexedCorner.multiply(this.sideLength / 2)), this.sideLength / 2, this.capacity, this);
		}

		this.dataPoints.forEach(dataPoint => {
			this.add(dataPoint);
		});

		this.dataPoints = undefined;
	}

	getDistanceFromEdge(location) {
		return Math.min(
			Math.min(location.x - this.corner.x, (this.corner.x + this.sideLength) - location.x),
			Math.min(location.y - this.corner.y, (this.corner.y + this.sideLength) - location.y),
			Math.min(location.z - this.corner.z, (this.corner.z + this.sideLength) - location.z)
		);
	}

	getAllDataPoints() {
		if (this.isLeaf) return this.dataPoints;

		let result = [];

		this.childCubes.forEach(childCube =>
			result = result.concat(childCube.getAllDataPoints())
		);

		return result;
	}

	findClosestDataPoint(location) {

		const findClosestDataPointRecursive = (cube) => {
			const distanceFromEdgeSquared = cube.getDistanceFromEdge(location) ** 2;
			let closestPointDistanceSquared = Infinity;
			let closestPoint = null;

			cube.getAllDataPoints().forEach(dataPoint => {
				const distanceSquared = (location.x - dataPoint.location.x)**2 + (location.y - dataPoint.location.y)**2 + (location.z - dataPoint.location.z)**2;
				if (distanceSquared < closestPointDistanceSquared) {
					closestPoint = dataPoint;
					closestPointDistanceSquared = distanceSquared;
				}
			})

			if (distanceFromEdgeSquared < closestPointDistanceSquared && cube.parent) {
				return findClosestDataPointRecursive(cube.parent);
			}

			return closestPoint;
		}

		return findClosestDataPointRecursive(this.findAppropriateCube(location));
	}
}